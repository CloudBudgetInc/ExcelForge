//import {_getCopy, _message} from "c/efUtils";
import {_message} from "c/efUtils";

const CELL_REG_EXP = /[A-Za-z]+\d+|\S/g;

const calculateFormulaCells = (tableRows) => {
	tableRows.forEach(row => {
		row.cells.forEach(cell => {
			if (!cell.formula) return null;
			cell.value = getFormulaResult(cell.formula, tableRows);
			console.log(' cell.value = ' + cell.value);
		});
	});
	return tableRows;
};

const getFormulaResult = (formula, tableRows) => {
	try {
		let cellNames = extractCellNames(formula);
		if (!cellNames || cellNames.length === 0) return 0;
		const replacementMap = {};
		cellNames.forEach(cellName => {
			const [rowIndex, cellIndex] = getCellCoordinates(cellName);
			const sourceCell = tableRows[rowIndex].cells[cellIndex];
			let value = 0;
			if (sourceCell) {
				if (sourceCell.value) {
					value = sourceCell.value;
				} else {
					if (sourceCell.formula) value = getFormulaResult(sourceCell.formula, tableRows);
				}
			}
			replacementMap[cellName] = value;
		});
		Object.keys(replacementMap).forEach(cellName => {
			const cellValue = replacementMap[cellName];
			formula = formula.replace(cellName, cellValue);
		});
		return eval(formula);
	} catch (e) {
		_message('error', 'Formula Error : ' + e);
		return 'error';
	}
};

/**
 * Method gets formula like "A4 * (B7 + K15) * F25" and returns an array like ["A4", "B7", "K15", "F25"]
 */
const extractCellNames = (inputString) => {
	const expressions = inputString.match(CELL_REG_EXP);
	return expressions.filter(expr => /[A-Za-z]+\d+/.test(expr));
};

/**
 * Method gets cell Name line 'K35' and returns its coordinates like [11, 35] (row and column index)
 */
const getCellCoordinates = (cellName) => {
	const letters = cellName.match(/[A-Z]+/)[0];
	const rowIndex = parseInt(cellName.match(/\d+/)[0]);
	const getAlphabeticalPosition = (letters) => {
		const letterPosition = (letter) => letter.toUpperCase().charCodeAt(0) - 'A'.charCodeAt(0) + 1;
		if (letters.length === 0) return 0;
		const lastLetter = letters.charAt(letters.length - 1);
		const otherLetters = letters.substring(0, letters.length - 1);
		return letterPosition(lastLetter) + 26 * getAlphabeticalPosition(otherLetters);
	};
	const colIndex = getAlphabeticalPosition(letters);
	return [rowIndex - 1, colIndex - 1];
};

export {calculateFormulaCells};