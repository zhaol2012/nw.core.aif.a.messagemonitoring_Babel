sap.ui.define([
	"sap/ui/base/EventProvider",
	"sap/ui/model/Filter",
	"sap/ui/model/odata/v4/ODataUtils",
	"sap/ui/comp/filterbar/FilterGroupItem",
	"nw/core/aif/a/messagemonitoring/util/formatter",
	"nw/core/aif/a/messagemonitoring/util/FilterInputDelegate",
	"sap/ui/model/json/JSONModel",
	"sap/m/TableSelectDialog"
], function (EventProvider, Filter, ODataUtils, FilterGroupItem, formatter, FilterInputDelegate, JSONModel, TableSelectDialog) {
	"use strict";
	return EventProvider.extend("nw.core.aif.a.messagemonitoring.util.FilterBarDelegate", {
		constructor: function (oFilterBar, oController) {
			this._oFilterBar = oFilterBar;
			this._oController = oController;
			this._skeyGroupName = "Keys";
			this._skeyGroupTitle = oController._oI18nModel.getResourceBundle().getText("AIFKeyfields");
			this._bKeyFieldInfoLoaded = [];
			this._bKeyFieldHelpLoaded = false;
			this._oKeyfieldDelegates = {};
			this._getGUIDInput();
		},

		_getGUIDInput: function () {
			this._oGuidInput = new FilterInputDelegate(this._oController);
			var oResource = this._oController._oI18nModel.getResourceBundle();
			var sMsgLabel = oResource.getText("columnMessageGuid");
			this._oGuidInput.loadPreDefinedControl(this._oController._oView.byId("GUIDInput"), "MessageGuid", sMsgLabel);
			var oDataLabel = {
				RecordRow: -2,
				SearchFieldName: "MessageGuid",
				SearchFieldValue: sMsgLabel
			};
			this._oGuidInput.addValue(oDataLabel);
			var oDataTarget = {
				RecordRow: -1,
				SearchFieldName: "MessageGuid",
				SearchFieldValue: "MessageGuid"
			};
			this._oGuidInput.addValue(oDataTarget);
		},
		getFiltersText: function () {
			var sValueSep = " ";
			var sValueEqu = " = ";
			var oResource = this._oController._oI18nModel.getResourceBundle();
			var sText = "",
				iFilters = 0,
				sSep = "",
				sFilterSep = oResource.getText("filterSeprate") + " ";
			var oFiltersOjbect = this._oFiltersModel.getProperty("/");
			// Date
			if (oFiltersOjbect.from) {
				sText += (oResource.getText("dateFrom") + sValueSep + oFiltersOjbect.from);
				iFilters += 1;
				sSep = sFilterSep;
			}
			if (oFiltersOjbect.to) {
				sText += (sSep + oResource.getText("dateTo") + sValueSep + oFiltersOjbect.to);
				iFilters += 1;
				sSep = sFilterSep;
			}
			// status
			var sStatusText = "",
				sStatusSep = "";
			oFiltersOjbect.statusValues.forEach(function (sStatus) {
				if (sStatus === "M") {
					var sEStatus = "50";
				}
				sStatusText += (sStatusSep + formatter.getStatusText(sStatus, sEStatus));
				sStatusSep = ", ";
			});
			if (sStatusText) {
				sText += (sSep + oResource.getText("status") + sValueEqu + sStatusText);
				iFilters += 1;
				sSep = sFilterSep;
			}
			//message ID
			if (oFiltersOjbect.messageID) {
				sText += (sSep + oResource.getText("messageID") + sValueEqu + oFiltersOjbect.messageID);
				iFilters += 1;
				sSep = sFilterSep;
			}
			Object.keys(this._oKeyfieldDelegates).forEach(function (sFieldname) {
				var sKeyfieldText = this._oKeyfieldDelegates[sFieldname].getInputText();
				if (sKeyfieldText) {
					sText += (sSep + sKeyfieldText);
					iFilters += 1;
					sSep = sFilterSep;
				}
			}.bind(this));
			sText = oResource.getText("filterBy", [iFilters]) + sText;
			return sText;
		},
		setFiltersObject: function (oAddionalData) {
			var aStatusList = this._getStatusList();
			var oObject = {
				from: "",
				to: "",
				statusList: aStatusList,
				statusValues: [],
				messageID: "",
				LogMessage: ""
			};
			Object.keys(oAddionalData).forEach(function (sKey) {
				oObject[sKey] = oAddionalData[sKey];
			});
			this._oFiltersModel = new JSONModel(oObject);
			this._oController._oView.setModel(this._oFiltersModel, "Filters");
		},
		getStandardFilters: function () {
			var oFiltersOjbect = this._oFiltersModel.getProperty("/");
			var aFilters = [];
			// Date
			var sForm = oFiltersOjbect.from;
			var sTo = oFiltersOjbect.to;
			if (!sForm) {
				sForm = formatter.getFormatedDate(new Date(0)); //very early 
			}
			if (!sTo) {
				sTo = formatter.getFormatedDate(new Date(9900, 12, 1)); //very later
			}
			var oFrom = formatter.getConvertedDate(sForm);
			var oTo = formatter.getConvertedDate(sTo);
			if (!oFrom) {
				var oError = new Error();
				oError.controId = "DTfrom";
				throw oError;
			}
			if (!oTo) {
				oError = new Error();
				oError.controId = "DTto";
				throw oError;
			}
			aFilters.push(new Filter({
				path: "ProcessDate",
				operator: sap.ui.model.FilterOperator.BT,
				value1: formatter.getEDMDate(oFrom),
				value2: formatter.getEDMDate(oTo)
			}));
			// status
			oFiltersOjbect.statusValues.forEach(function (sValue) {
				switch (sValue) {
				case "E":
					aFilters.push(new Filter({
						path: "Status",
						operator: sap.ui.model.FilterOperator.EQ,
						value1: "E"
					}));
					aFilters.push(new Filter({
						path: "Status",
						operator: sap.ui.model.FilterOperator.EQ,
						value1: "A"
					}));
					break;
				case "M":
					aFilters.push(new Filter({
						path: "EditedStatus",
						operator: sap.ui.model.FilterOperator.EQ,
						value1: "50"
					}));
					break;
				default:
					aFilters.push(new Filter({
						path: "Status",
						operator: sap.ui.model.FilterOperator.EQ,
						value1: sValue
					}));
				}
			});
			//message ID
			if (oFiltersOjbect.messageID) {
				var sOp = sap.ui.model.FilterOperator.EQ;
				// if (oFiltersOjbect.messageID.includes("*")) {
				// 	sOp = sap.ui.model.FilterOperator.Contains;
				// }
				aFilters.push(new Filter({
					path: "MessageGuid",
					operator: sOp,
					value1: oFiltersOjbect.messageID
				}));
			}

			return aFilters;
		},
		getKeyfieldsFilters: function (aOrderKeyfields) {
			if (!this._oKeyfieldDelegates) {
				return [];
			}
			var oFilters = {};
			oFilters.FILTERS = {};
			Object.keys(this._oKeyfieldDelegates).forEach(function (sFieldname) {
				var aFieldFilters = this._oKeyfieldDelegates[sFieldname].getInputFilters();
				if (aFieldFilters && aFieldFilters.length > 0) {
					oFilters.FILTERS[sFieldname] = aFieldFilters;
				}
			}.bind(this));
			if (aOrderKeyfields && aOrderKeyfields.length > 0) {
				oFilters.ORDERBY = aOrderKeyfields;
			}
			var aFilters = [];
			if (Object.keys(oFilters.FILTERS).length > 0 || oFilters.ORDERBY) {
				var sFilters = JSON.stringify(oFilters);
				aFilters.push(new Filter({
					path: "KeyFields",
					operator: sap.ui.model.FilterOperator.EQ,
					value1: sFilters
				}));
			}
			return aFilters;
		},
		handleMessageIDValueHelp: function (oEvent) {

			//set value help model
			var oValueHelp = {
				list: []
			};
			this._oController._oTable.getRows().forEach(function (oRow) {
				var oBindingContext = oRow.getBindingContext();
				if (oBindingContext) {
					var oBindingData = oRow.getBindingContext().getObject();
					var oHelpData = {};
					if (oBindingData.KeyFields) {
						var oKeyObj = JSON.parse(oBindingData.KeyFields).VALUES;
						Object.keys(oKeyObj).forEach(function (sKey) {
							oHelpData[sKey] = oKeyObj[sKey].toString();
						});
					}
					oHelpData.MessageGuid = oBindingData.MessageGuid;
					oValueHelp.list.push(oHelpData);
				}
			});
			this._oGuidInput.setModelData(oValueHelp);
			this._oGuidInput.onValueHelpOpen(oEvent);
		},
		loadHelpDialogs: function () {
			Object.keys(this._oKeyfieldDelegates).forEach(function (sFieldname) {
				this._oKeyfieldDelegates[sFieldname].loadHelpDialog();
			}.bind(this));
			this._oGuidInput.loadHelpDialog(this.handleMessageIDValueHelp, this);
		},
		addHelpData: function (oHelpValue) {
			if (!this._oKeyfieldDelegates[oHelpValue.FieldName]) {
				this._oKeyfieldDelegates[oHelpValue.FieldName] = new FilterInputDelegate(this._oController);
			}
			this._oKeyfieldDelegates[oHelpValue.FieldName].addValue(oHelpValue);
		},

		loadKeyfieldFilter: function (oKeyfieldData) {
			if (!this._oKeyfieldDelegates[oKeyfieldData.FieldName]) {
				this._oKeyfieldDelegates[oKeyfieldData.FieldName] = new FilterInputDelegate(this._oController);
			}
			this._oKeyfieldDelegates[oKeyfieldData.FieldName].loadType(oKeyfieldData);
			var sFilterGroupId = this._oController._oView.createId("_FilterItem" + oKeyfieldData.FieldName);
			this._oFilterBar.addFilterGroupItem(new FilterGroupItem(sFilterGroupId, {
				label: formatter.getFieldLabel(oKeyfieldData.Label, oKeyfieldData.FieldName),
				name: oKeyfieldData.FieldName,
				groupName: this._skeyGroupName,
				groupTitle: this._skeyGroupTitle,
				visibleInFilterBar: true,
				control: [this._oKeyfieldDelegates[oKeyfieldData.FieldName].getInputControl()]
			}));
			//for message guid display
			var oDataLabel = {
				RecordRow: -2,
				SearchFieldName: oKeyfieldData.FieldName,
				SearchFieldValue: formatter.getFieldLabel(oKeyfieldData.Label, oKeyfieldData.FieldName)
			};
			this._oGuidInput.addValue(oDataLabel);

		},
		_getStatusList: function () {
			var oResource = this._oController._oI18nModel.getResourceBundle();
			var oStatusList = [{
				key: "E",
				label: oResource.getText("statusError")
			}, {
				key: "S",
				label: oResource.getText("statusSuccess")
			}, {
				key: "W",
				label: oResource.getText("statusWarning")
			}, {
				key: "I",
				label: oResource.getText("statusInProcess")
			}, {
				key: "C",
				label: oResource.getText("statusCanceled")
			}, {
				key: "M",
				label: oResource.getText("statusEdited")
			}];
			return oStatusList;
		},
		onInputChange: function (oEvent) {
			var oInputControl = oEvent.getSource();
			oInputControl.setValueState(sap.ui.core.ValueState.None);
		},
		destroy: function () {
			Object.keys(this._oKeyfieldDelegates).forEach(function (sFieldname) {
				this._oKeyfieldDelegates[sFieldname].destroy();
			}.bind(this));
			this._oGuidInput.destroy();
		}

	});
});