import {_getCopy, _message} from "c/efUtils";
import {getPivotTableObject} from "c/efPivotTable";
import {calculateFormulaCells} from "./efExcelFormulas";

let c;
let styleMap = {}; // key is style Id, value is EFStyle object
const sheets = [];
const MIN_SHEET_WIDTH = 20;
const MIN_SHEET_HEIGHT = 50;
const DEFAULT_COLUMN_WIDTH = 75;

const pivotTableTasks = [];

const setContext = (context) => {
	c = context;
};

const generateTabs = () => {
	c.tabs = [];
	const openedSheetId = localStorage.getItem('openedSheetIdFor' + c.tableStructure.template.Id);
	c.sheets.forEach((sheet, i) => c.tabs.push({
		label: sheet.Name,
		value: sheet.Id,
		class: (!openedSheetId && i === 0) || openedSheetId === sheet.Id ? 'selectedButton' : ''
	}));
};

const generateTable = () => {
	try {
		styleMap = c.styles.reduce((r, st) => {
			r[st.Id] = st;
			return r;
		}, {});
		c.sheets.forEach(sheet => c.allSheets.push(generateSheet(sheet)));
		const openSheetId = localStorage.getItem('openedSheetIdFor' + c.tableStructure.template.Id);
		let openedSheet;
		if (openSheetId != null) openedSheet = c.allSheets.find(sheet => sheet.Id === openSheetId);
		c.openedSheet = openedSheet || c.allSheets[0];
	} catch (e) {
		_message('error', 'Generate Table Error : ' + e);
	}
};

const generateSheet = (sheet) => {
	//console.log('GENERATE SHEET : ' + sheet.Name);
	try {
		const tableSheet = {
			name: sheet.Name,
			letterHeaders: [],
			rows: [],
			Id: sheet.Id,
			rowNumber: sheet.exf__NumberOfRows__c || MIN_SHEET_HEIGHT,
			colNumber: sheet.exf__NumberOfColumns__c || MIN_SHEET_WIDTH,
		}; // list of rows
		const sheetId = sheet.Id.substring(0, 15);
		const columns = c.columns.filter(col => col.exf__EFSheet__c.substring(0, 15) === sheetId);
		const rows = c.rows.filter(row => row.exf__EFSheet__c.substring(0, 15) === sheetId);
		const cells = c.cells.filter(cell => cell.exf__EFSheet__c === sheetId);
		//console.log('ALL Cells : ' + JSON.stringify(c.cells));
		//console.log('sheet.Id : ' + sheetId);
		//console.log('Cells : ' + JSON.stringify(cells));
		setExcelTopHeaderAndTableWidth(tableSheet, columns);
		setExcelRows(tableSheet, rows, cells);
		return tableSheet;
	} catch (e) {
		_message('error', 'Generate Sheet Error : ' + e);
	}
};

const setExcelTopHeaderAndTableWidth = (tableSheet, columns) => {
	try {
		tableSheet.letterHeaders = [{s: `width: 40px`, letter: ''}];
		const columnsMap = columns.reduce((r, col) => {
			r[col.exf__Index__c] = col;
			return r;
		}, {});
		//console.log('COL MAP:' + JSON.stringify(columnsMap));
		let totalTableWidth = 0;
		generateExcelAlphabetArray(MIN_SHEET_WIDTH).forEach((letter, i) => {
			const indicatedColumn = columnsMap[i + 1];
			//console.log('col #' + (i + 1) + ' width: ' + indicatedColumn?.exf__Width__c);
			const width = indicatedColumn?.exf__Width__c ? indicatedColumn?.exf__Width__c : DEFAULT_COLUMN_WIDTH;
			totalTableWidth += +width;
			tableSheet.letterHeaders.push({s: `width: ${width}px`, letter, Id: indicatedColumn?.Id, idx: i + 1});
		});
		tableSheet.tableStyle = `width: ${totalTableWidth}px;`;
	} catch (e) {
		_message('error', 'Set Excel Top Borders Error : ' + e);
	}
};

/**
 * Method generates a structure of sheet with empty rows and columns
 * @param tableSheet
 * @param rows
 * @param cells
 */
const setExcelRows = (tableSheet, rows, cells) => {
	try {

		let tableRows = [];
		const rowCellMatrix = getRowCellMatrix(cells);
		const rowsMap = rows.reduce((r, row) => { // in the future style for whole row
			r[row.exf__Index__c] = row.exf__Width__c;
			return r;
		}, {});
		for (let rowIdx = 0; rowIdx < tableSheet.rowNumber; rowIdx++) { // ROW is X, Column is Y
			const tableRow = {numberHeader: {number: rowIdx + 1}, cells: []};
			for (let colIdx = 0; colIdx < tableSheet.colNumber; colIdx++) {
				const cell = rowCellMatrix[rowIdx + 1]?.[colIdx + 1];
				const tableCell = {
					rowIdx: rowIdx + 1,
					colIdx: colIdx + 1,
					cellId: cell ? cell.Id : undefined,
					value: cell ? getCellValue(cell) : '',
					style: getCSSStyle(cell?.exf__EFStyle__c),
					formula: cell?.exf__Formula__c
				};
				tableRow.cells.push(tableCell);
			}
			tableRows.push(tableRow);
		}
		tableRows = populateCellsWithPivotTable(tableRows);
		tableRows = calculateFormulaCells(tableRows);
		tableSheet.rows = tableRows;
	} catch (e) {
		_message('error', 'Set Excel Rows Error : ' + e);
	}
};

const getCellValue = (cell) => {
	try {
		//console.log('Get Value for ' + cell.Name + ' => ' + cell.exf__EFDataSet__c);
		if (!cell.exf__EFDataSet__c) return cell.exf__Value__c; // no Data sets
		const dataSet = c.dSetMap[cell.exf__EFDataSet__c];
		if (dataSet.exf__Type__c === 'Single') {
			const sObject = c.sObjectsMap[cell.exf__EFDataSet__c][0];
			return sObject[cell.exf__DataSetField__c];
		} else {
			return '$PT' + cell.exf__EFDataSet__c;
		}
	} catch (e) {
		_message('error', 'Get Cell Value Error : ' + e);
	}
};

const populateCellsWithPivotTable = (tableRows) => {
	try {
		let updatedTableRows = _getCopy(tableRows);
		tableRows.forEach((row, rIdx) => {
			row.cells.forEach((cell, cellIdx) => {
				if (cell?.value?.includes('$PT')) {
					addPivotTableCells(updatedTableRows, rIdx, cellIdx, cell.value.replace('$PT', ''));
				}
			})
		});
		return updatedTableRows;
	} catch (e) {
		_message('error', 'Populate Pivot Table Error ' + e);
	}
};
/**
 * Method integrates pivot table to an excel sheet
 * @param tableRows
 * @param rIdx
 * @param cellIdx
 * @param dataSetId
 */
const addPivotTableCells = (tableRows, rIdx, cellIdx, dataSetId) => {
	try {
		const dataSet = c.dSetMap[dataSetId];
		const dataList = c.sObjectsMap[dataSetId];
		const config = JSON.parse(dataSet.exf__PivotConfiguration__c);
		let pivotTableObject = getPivotTableObject(dataList, config);
		const headers = pivotTableObject.headers;
		const reportLines = pivotTableObject.reportLines;

		const headerRow = tableRows[rIdx];
		let headerColIdx = cellIdx;
		headers.forEach(header => {
			const cell = headerRow.cells[headerColIdx];
			cell.value = header;
			headerColIdx++;
		});

		let rlRowIdx = rIdx;
		reportLines.forEach(rl => {
			let rlRow = tableRows[++rlRowIdx];
			if (!rlRow) {
				_message('warning', 'Not enough rows');
				return null;
			}
			console.log('---- ' + JSON.stringify(rlRow));
			const values = [...rl.titles, ...rl.values];
			let rlColIdx = cellIdx;
			values.forEach(v => {
				const cell = rlRow.cells[rlColIdx++];
				cell.value = v;
			})
		});
	} catch (e) {
		_message('error', 'Add Pivot Table Cells Error ' + e);
	}

};

const getCSSStyle = (styleId) => {
	const style = styleMap[styleId];
	return style ? style.exf__StyleCSS__c : undefined;
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