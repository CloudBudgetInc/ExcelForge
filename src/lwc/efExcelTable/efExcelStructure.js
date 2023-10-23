import {_message} from "c/efUtils";

let c;
let styleMap = {}; // key is style Id, value is EFStyle object
const sheets = [];
const MIN_SHEET_WIDTH = 20;
const MIN_SHEET_HEIGHT = 20;
const defaultColumnWidth = 75;

const setContext = (context) => {
	c = context;
};

const generateTabs = () => {
	c.tabs = [];
	c.sheets.forEach((sheet, i) => c.tabs.push({
		label: sheet.Name,
		value: sheet.Id,
		class: i === 0 ? 'selectedButton' : ''
	}));
};

const generateTable = () => {
	console.log('GENERATE TABLE');
	try {
		styleMap = c.styles.reduce((r, st) => {
			r[st.Id] = st;
			return r;
		}, {});
		console.log('Style Map = ' + JSON.stringify(styleMap));
		c.sheets.forEach(sheet => c.allSheets.push(generateSheet(sheet)));
		c.openedSheet = c.allSheets[0];
		console.log('OPENED SHEET : ' + JSON.stringify(c.openedSheet));
	} catch (e) {
		_message('error', 'Generate Table Error : ' + e);
	}
};

const generateSheet = (sheet) => {
	console.log('GENERATE SHEET : ' + sheet.Name);
	try {
		const tableSheet = {letterHeaders: [], rows: [], Id: sheet.Id}; // list of rows
		const sheetId = sheet.Id.substring(0, 15);
		const columns = c.columns.filter(col => col.exf__EFSheet__c.substring(0, 15) === sheetId);
		const rows = c.rows.filter(row => row.exf__EFSheet__c.substring(0, 15) === sheetId);
		const cells = c.cells.filter(cell => cell.exf__EFSheet__c === sheetId);
		console.log('ALL Cells : ' + JSON.stringify(c.cells));
		console.log('sheet.Id : ' + sheetId);
		console.log('Cells : ' + JSON.stringify(cells));
		setExcelTopHeader(tableSheet, columns);
		setExcelRows(tableSheet, rows, cells);
		return tableSheet;
	} catch (e) {
		_message('error', 'Generate Sheet Error : ' + e);
	}
};

const setExcelTopHeader = (tableSheet, columns) => {
	try {
		tableSheet.letterHeaders = [{s: `width: 40px`, letter: ''}];
		const columnsMap = columns.reduce((r, col) => {
			r[col.exf__Index__c] = col;
			return r;
		}, {});
		console.log('COL MAP:' + JSON.stringify(columnsMap));
		generateExcelAlphabetArray(MIN_SHEET_WIDTH).forEach((letter, i) => {
			const indicatedColumn = columnsMap[i + 1];
			console.log('col #' + (i + 1) + ' width: ' + indicatedColumn?.exf__Width__c);
			const width = indicatedColumn?.exf__Width__c ? indicatedColumn?.exf__Width__c : defaultColumnWidth;
			tableSheet.letterHeaders.push({s: `width: ${width}px`, letter, Id: indicatedColumn?.Id, idx: i + 1});
		});
	} catch (e) {
		_message('error', 'Set Excel Top Borders Error : ' + e);
	}
};

const setExcelRows = (tableSheet, rows, cells) => {
	try {
		const tableRows = [];
		const rowCellMatrix = getRowCellMatrix(cells);
		const rowsMap = rows.reduce((r, row) => { // in the future style for whole row
			r[row.exf__Index__c] = row.exf__Width__c;
			return r;
		}, {});
		for (let xIdx = 0; xIdx < MIN_SHEET_HEIGHT; xIdx++) {
			const tableRow = {numberHeader: {number: xIdx + 1}, cells: []};
			for (let yId = 0; yId < MIN_SHEET_WIDTH; yId++) {
				const cell = rowCellMatrix[xIdx + 1]?.[yId + 1];
				const tableCell = {
					idx: yId + 1,
					value: cell ? getCellValue(cell) : '',
					style: getCSSStyle(cell?.exf__EFStyle__c)
				};
				tableRow.cells.push(tableCell);
			}
			tableRows.push(tableRow);
		}
		tableSheet.rows = tableRows;
	} catch (e) {
		_message('error', 'Set Excel Rows Error : ' + e);
	}
};

const getCellValue = (cell) => {
	try {
		console.log('Get Value for ' + cell.Name + ' => ' + cell.exf__EFDataSet__c);
		if (!cell.exf__EFDataSet__c) return cell.exf__Value__c;
		const sObject = c.sObjectsMap[cell.exf__EFDataSet__c][0];
		console.log('sObject:' + JSON.stringify(sObject));
		console.log('cell.DataSetField__c:' + cell.exf__DataSetField__c);
		console.log('val:' + sObject[cell.exf__DataSetField__c]);
		return sObject[cell.exf__DataSetField__c];
	} catch (e) {
		_message('error', 'Get Cell Value Error : ' + e);
	}
};

/**
 * TODO: Remove it to CSS classes
 * @param styleId
 * @return {string|undefined}
 */
const getCSSStyle = (styleId) => {
	const style = styleMap[styleId];
	if (!styleId || !style) return undefined;
	//{"AlignmentHorizontal__c":"left","AlignmentVertical__c":"bottom","FillPatern__c":"none","FontBold__c":true,"FontItalic__c":false,"FontSize__c":16,"FontUnderline__c":false,"Id":"a3J55000000jKWTEA2","Name":"Header"}
	let result = 'height: 100%; width: 100%; ';
	if (style.exf__FillColor__c) result += `background-color: ${style.exf__FillColor__c}; `;
	if (style.exf__FontColor__c) result += `color: ${style.exf__FontColor__c}; `;
	if (style.exf__FontSize__c) result += `font-size: ${style.exf__FontSize__c}px; `;
	return result;
};


/**
 * Method returns object where key is row index value is object where key is cell index and value is cell
 */
const getRowCellMatrix = (cells) => {

	const rowCellMatrix = {};
	for (let i = 0; i < cells.length; i++) {
		const cell = cells[i];
		const {exf__EFRowIndex__c: rowIndex, exf__Index__c: cellIndex} = cell;
		let cellObject = rowCellMatrix[rowIndex];
		if (!cellObject) {
			cellObject = {};
			rowCellMatrix[rowIndex] = cellObject;
		}
		cellObject[cellIndex] = cell;
	}
	return rowCellMatrix;
};

/**
 * Method returns excel letters array
 */
const generateExcelAlphabetArray = (length) => {
	const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
	const result = [];
	let count = 0;
	let letter = '';
	while (result.length < length) {
		if (count === alphabet.length) {
			count = 0;
			letter = letter + 'A';
		}
		if (letter === '') {
			result.push(alphabet[count]);
		} else {
			result.push(letter + alphabet[count]);
		}
		count++;
	}
	return result;
};

export {setContext, generateTable, generateTabs};