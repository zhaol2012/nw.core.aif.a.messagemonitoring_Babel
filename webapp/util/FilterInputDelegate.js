sap.ui.define([
	"sap/ui/base/EventProvider",
	"sap/ui/model/Filter",
	"sap/ui/model/odata/v4/ODataUtils",
	"nw/core/aif/a/messagemonitoring/util/formatter",
	"sap/ui/model/json/JSONModel",
	"sap/m/TableSelectDialog",
	"sap/m/Column",
	"sap/m/ColumnListItem",
	"sap/m/Text"
], function (EventProvider, Filter, ODataUtils, formatter, JSONModel, TableSelectDialog, Column, ColumnListItem, Text) {
	"use strict";
	return EventProvider.extend("nw.core.aif.a.messagemonitoring.util.FilterInputDelegate", {
		constructor: function (oController) {
			this._oController = oController;
			this._aHelpModelPathList = [];
			this._aColumns = [];
			this._aCells = [];
			this._oValueHelpData = {
				list: []
			};
		},
		loadType: function (oFieldData) {
			this._sFieldName = oFieldData.FieldName;
			this._sFieldLabel = formatter.getFieldLabel(oFieldData.Label, oFieldData.FieldName);
			this._sInputMask = oFieldData.InputMask;
			this._sSearchHelpTitle = this._oController._oI18nModel.getResourceBundle().getText("KeyfieldsSelectTitle", [this._sFieldLabel]);
			this._sType = this._getType(oFieldData);
			this._oInput = this._loadInputControl();
			this._sModelName = "_Key" + this._sFieldName;
		},
		loadPreDefinedControl: function (oControl, sFieldName, sFieldLabel) {
			this._oInput = oControl;
			this._sType = "S";
			this._sFieldName = sFieldName;
			this._sFieldLabel = formatter.getFieldLabel(sFieldLabel, sFieldName);
			this._sSearchHelpTitle = this._oController._oI18nModel.getResourceBundle().getText("KeyfieldsSelectTitle", [this._sFieldLabel]);
			this._sModelName = "_Key" + this._sFieldName;
		},
		_getType: function (oFieldData) {
			switch (oFieldData.Type) {
			case "Edm.Int32":
			case "Edm.Decimal":
			case "Edm.Double":
			case "Edm.Int16":
			case "Edm.Int64":
			case "Edm.Single":
				return "I";
			case "Edm.Date":
				return "D";
			case "Edm.DateTimeOffset":
				return "DT";
			case "Edm.TimeOfDay":
				return "T";
			default:
				return "S";
			}
		},
		_loadInputControl: function () {
			switch (this._sType) {
			case "I":
				return new sap.m.Input({
					submit: this._oController.onSearch.bind(this._oController),
					type: sap.m.InputType.Number,
					placeholder: this._sFieldLabel
				});
			case "S":
				return new sap.m.Input({
					submit: this._oController.onSearch.bind(this._oController),
					type: sap.m.InputType.Text,
					placeholder: this._sFieldLabel
				});
			case "D":
				return new sap.m.DatePicker({
					displayFormat: "medium"
				});
			case "DT":
				return new sap.m.DateTimePicker({
					displayFormat: "medium"
				});
			case "T":
				return new sap.m.TimePicker({
					displayFormat: "medium"
				});
			default:
				return new sap.m.Input({
					submit: this._oController.onSearch.bind(this._oController),
					type: sap.m.InputType.Text,
					placeholder: this._sFieldLabel
				});
			}
		},
		setModelData: function (oData) {
			this._oModel.setData(oData);
		},
		getInputText: function () {
			var sValueEqu = " = ";
			var sValue = this._oInput.getValue();
			var sText = "";
			if (sValue) {
				sText = this._sFieldLabel + sValueEqu + sValue;
			}
			return sText;
		},
		loadHelpDialog: function (fnOpen, oHandle) {

			this._oModel = new JSONModel({});
			this._oController._oView.setModel(this._oModel, this._sModelName);
			//create dialog
			if ((this._sType !== "DT" || this._sType !== "T" || this._sType !== "D") && (this._oValueHelpData.list.length > 0 || fnOpen)) {
				this._oModel.setData(this._oValueHelpData);
				var sTableDialogId = this._oController._oView.createId("_TableDialg" + this._sFieldName);
				var iWidthSize = 20 * this._aColumns.length;
				var sWidthSize = "" + iWidthSize + "rem";
				this._oValueHelpDialog = new TableSelectDialog(sTableDialogId, {
					contentHeight: "auto",
					contentWidth: sWidthSize,
					items: {
						path: "/list",
						model: this._sModelName,
						template: new ColumnListItem({
							cells: this._aCells
						})
					},
					search: this.onValueHelpSearch.bind(this),
					confirm: this.onValueHelpConfirm.bind(this),
					cancel: this.onValueHelpCancel.bind(this),
					title: this._sSearchHelpTitle,
					columns: this._aColumns
				});
				this._oController._oView.addDependent(this._oValueHelpDialog);
				this._oInput.setShowValueHelp(true);
				if (fnOpen) {
					this._oInput.attachValueHelpRequest(fnOpen, oHandle);
				}
				this._oInput.attachValueHelpRequest(this.onValueHelpOpen, this);
			}
		},
		getInputControl: function () {
			return this._oInput;
		},
		getInputFilters: function () {
			var sValue = this._oInput.getValue();
			var aFilters = [];
			if (sValue) {
				switch (this._sType) {
				case "I":
					break;
				case "D":
					//convert value
					sValue = formatter.getAbapDate(sValue);
					break;
				case "DT":
					//convert value
					sValue = formatter.getAbapDateTime(sValue);
					break;
				case "T":
					//convert value
					sValue = formatter.getAbapTime(sValue);
					break;
				default:
					if (sValue.includes("*")) {
						aFilters.push({
							SIGN: "I",
							OPTION: "CP",
							LOW: sValue,
							HIGH: ""
						});
					} else {
						aFilters.push({
							SIGN: "I",
							OPTION: "EQ",
							LOW: sValue,
							HIGH: ""
						});
					}
					return aFilters;
				}
				aFilters.push({
					SIGN: "I",
					OPTION: "EQ",
					LOW: sValue,
					HIGH: ""
				});
			}
			return aFilters;
		},
		onValueHelpSearch: function (oEvent) {
			var sValue = oEvent.getParameter("value");
			var aFilters = [];
			this._aHelpModelPathList.forEach(function (sPath) {
				aFilters.push(new Filter(sPath, sap.ui.model.FilterOperator.Contains, sValue));
			});
			var oFilter = new Filter(aFilters, false);
			var oBinding = oEvent.getSource().getBinding("items");
			oBinding.filter([oFilter]);
		},
		onValueHelpConfirm: function (oEvent) {
			var aContexts = oEvent.getParameter("selectedContexts");
			if (aContexts && aContexts.length > 0) {
				var sValue = aContexts[0].getObject()[this.sRecordParameterName];
				if (sValue !== undefined) {
					this._oInput.setValue(sValue);
				}
			}
		},
		onValueHelpOpen: function (oEvent) {
			this._oValueHelpDialog.open();
		},
		onValueHelpCancel: function (oEvent) {
			// this._oValueHelpDialog.close();
		},
		addValue: function (oValue) {
			if (oValue.RecordRow === -2) {
				// column label, create column
				var sDialogColumnId = this._oController._oView.createId("_DialogColumn" + oValue.SearchFieldName);
				this._aColumns.push(new Column(sDialogColumnId, {
					width:"auto",
					header: new Text({
						text: oValue.SearchFieldValue
					})
				}));
				var sDialogTextId = this._oController._oView.createId("_DialogText" + oValue.SearchFieldName);
				this._aCells.push(new Text(sDialogTextId, {
					text: {
						path: oValue.SearchFieldName,
						model: this._sModelName
					}
				}));
				this._aHelpModelPathList.push(oValue.SearchFieldName);
			} else if (oValue.RecordRow === -1) {
				this.sRecordParameterName = oValue.SearchFieldValue;
			} else {
				if (oValue.RecordRow !== undefined) {
					var iRowId = oValue.RecordRow - 1;
					if (!this._oValueHelpData.list[iRowId]) {
						this._oValueHelpData.list[iRowId] = {};
					}
					this._oValueHelpData.list[iRowId][oValue.SearchFieldName] = oValue.SearchFieldValue;
					// column value
				}
			}
		},
		destroy: function () {
			if (this._oValueHelpDialog) {
				this._oValueHelpDialog.destroyItems();
				this._oValueHelpDialog.destroyColumns();
				this._oValueHelpDialog.destroy();
			}
			this._aCells.forEach(function (oCell) {
				oCell.destroy();
			});
			if (this._oInput) {
				this._oInput.destroy();
			}
		}

	});
});