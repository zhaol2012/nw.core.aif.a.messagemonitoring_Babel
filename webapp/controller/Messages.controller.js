sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"sap/ui/model/json/JSONModel",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator",
	"sap/m/MessageBox",
	'sap/m/MessageToast',
	"sap/ui/core/Fragment",
	"sap/ui/table/TablePersoController",
	"sap/ui/core/UIComponent",
	"nw/core/aif/a/messagemonitoring/util/formatter",
	"nw/core/aif/a/messagemonitoring/util/FilterBarDelegate",
	"nw/core/aif/a/messagemonitoring/util/CommentPopoverDelegate",
	"nw/core/aif/a/messagemonitoring/util/LogPopoverDelegate",
	"sap/base/security/encodeURL"
], function (Controller, JSONModel, Filter, FilterOperator, MessageBox, MessageToast, Fragment, TablePersoController, UIComponent,
	formatter,
	FilterBarDelegate,
	CommentPopoverDelegate, LogPopoverDelegate, encodeURL) {


	return Controller.extend("nw.core.aif.a.messagemonitoring.controller.Messages", {
		onInit: function () {
			//global fields
			this._oView = this.getView();
			this._oFilterBar = this._oView.byId("messageFilterbar");
			this._oStatusText = this._oView.byId("statusText");
			this._oDynPage = this._oView.byId("dynamicPage");
			this._oTable = this._oView.byId("messageOverviewTab");
			this._oManifest = this.getOwnerComponent().getMetadata();
			this._sMainUrl = this._oManifest.getManifest()["sap.app"].dataSources.mainService.uri;
			this._oRouter = this.getOwnerComponent().getRouter();
			this._oView.addStyleClass(this.getOwnerComponent().getContentDensityClass());
			this._oMessageModel = this.getOwnerComponent().getModel();
			this._oI18nModel = this.getOwnerComponent().getModel("i18n");
			this._oCDSModel = this.getOwnerComponent().getModel("CDS");
			this._oUIControModel = new JSONModel({
				isTechnicalInterface: false
			});
			this._oView.setModel(this._oUIControModel, "UI");
			this._oView.setModel(this._oCDSModel, "CDS");
			this._oView.setModel(this._oMessageModel);
			this._oView.setModel(this._oI18nModel, "i18n");
			this.oFilterBarDelegate = new FilterBarDelegate(this._oFilterBar, this);

			//start up parameters, update keyfields, load fragments...
			this._bKeyfieldUpdated = false;
			this._iKeyfieldColumnIndex = 4;
			this._aOrderedFieldName = [];
			this._parseStartupParameters();
			this.oFilterBarDelegate.setFiltersObject(this._oAdditionalPara);
			this._bindTable();
			this._updateKeyfields();
			this._addNavigation();

		},
		onExit: function () {
			this.oFilterBarDelegate.destroy();
			this._oTablePersonal.destroy();
		},
		formatter: formatter,
		oCommentPopoverDelegate: new CommentPopoverDelegate(),
		oLogPopoverDelegate: new LogPopoverDelegate(),
		onSearch: function (oEvent) {
			//ifkeys
			try {
				var oTableBinding = this._oTable.getBinding("rows");
				if (oTableBinding) {
					var aFilters = this._ifkeysFilters.slice(0)
						.concat(this.oFilterBarDelegate.getStandardFilters())
						.concat(this.oFilterBarDelegate.getKeyfieldsFilters(this._aOrderedFieldName));
					oTableBinding.filter(aFilters);
					if (this._oStatusText && this._oFilterBar) {
						var sText = this.oFilterBarDelegate.getFiltersText();
						this._oStatusText.setText(sText);
					}
				} else {
					this._bindTable();
				}

			} catch (oErr) {
				var oErrorControl = this.getView().byId(oErr.controId);
				if (oErrorControl) {
					oErrorControl.setValueState(sap.ui.core.ValueState.Error);
				}
			}
		},
		getvalue: function (sValue) {
			var sTargetName = this.data("FieldName");
			var oKeyObj = JSON.parse(sValue).VALUES;
			var sReturnValue = "";
			Object.keys(oKeyObj).forEach(function (sKey) {
				if (sKey === sTargetName) {
					sReturnValue = oKeyObj[sKey];
				}
			});
			return sReturnValue;
		},
		onMessageMatched: function (oEvent) {

		},
		_bindTable: function () {
			var aFilters = this._ifkeysFilters.slice(0)
				.concat(this.oFilterBarDelegate.getStandardFilters())
				.concat(this.oFilterBarDelegate.getKeyfieldsFilters());
			this._oTable.bindRows({
				path: "/IndexTableGenericSet",
				parameters: {
					$count: true
				},
				filters: aFilters,
				events: {
					change: this.onChangeRow.bind(this)
				}
			});
			if (this._oStatusText && this._oFilterBar) {
				var sText = this.oFilterBarDelegate.getFiltersText();

				this._oStatusText.setText(sText);

			}
		},
		_parseStartupParameters: function () {
			try { //get parameters
				this._oAdditionalPara = {};
				var oParameters = this.getOwnerComponent().getComponentData();
				if (oParameters && oParameters.startupParameters) {
					var oPara = oParameters.startupParameters;

					if (!oPara.NS || !oPara.IFNAME || !oPara.IFVER) {
						throw new Error("no interface parameters");
					}
					if (oPara.FROM) {
						var oDateFrom = this.formatter.parseEDMDate(decodeURIComponent(oPara.FROM), true);
						if (oDateFrom) {
							this._oAdditionalPara.from = this.formatter.getFormatedDate(oDateFrom);
						}
					}
					if (oPara.TO) {
						var oDateTo = this.formatter.parseEDMDate(decodeURIComponent(oPara.TO), true);
						if (oDateTo) {
							this._oAdditionalPara.to = this.formatter.getFormatedDate(oDateTo);
						}
					}
					if (oPara.STATUS) {
						this._oAdditionalPara.statusValues = [decodeURIComponent(oPara.STATUS)];
					}
					if (oPara.ISTECHIF) {
						this._oUIControModel.setProperty("/isTechnicalInterface", true);
					} else {
						this._oUIControModel.setProperty("/isTechnicalInterface", false);
					}
					this._sNs = decodeURIComponent(oPara.NS);
					this._sIfname = decodeURIComponent(oPara.IFNAME);
					this._sIfver = decodeURIComponent(oPara.IFVER);
					this._oFilterBar.setPersistencyKey("Filters" + this._sNs + "&" + this._sIfname + "&" + this._sIfver);
					this._ifkeysFilters = [
						new Filter({
							path: "Namespace",
							operator: sap.ui.model.FilterOperator.EQ,
							value1: this._sNs
						}),
						new Filter({
							path: "InterfaceName",
							operator: sap.ui.model.FilterOperator.EQ,
							value1: this._sIfname
						}),
						new Filter({
							path: "InterfaceVersion",
							operator: sap.ui.model.FilterOperator.EQ,
							value1: this._sIfver
						})
					];
				} else {
					throw new Error("no parameters");
				}
			} catch (oExp) {
				// parameters parse error, navigate to previous app
				MessageBox.error(oExp.message);
			}
		},
		_updateKeyfields: function () {
			var oKeyfieldsSetBinding = this._oMessageModel.bindList("/KeyFieldsSet");
			oKeyfieldsSetBinding.filter(this._ifkeysFilters);
			oKeyfieldsSetBinding.requestContexts(0, Infinity, "keyfield").then(function (aContext) {
				aContext.forEach(function (oContext) {
					var oData = oContext.getObject();
					this._addKeyfields(oData);
				}.bind(this));
				if (sap.ushell) {
					this._oPersona = sap.ushell.Container.getService("Personalization");
					var oPersId = {
						container: "TablePers" + this._sNs + this._sIfname + this._sIfver,
						item: "Columns"
					};
					var oPersonalService = this._oPersona.getPersonalizer(oPersId);
				}
				this._oTablePersonal = new TablePersoController({
					table: this._oTable,
					persoService: oPersonalService
				});
			}.bind(this));
			var oKeyfieldsHelpBinding = this._oMessageModel.bindList("/KeyFieldValueHelpSet");
			oKeyfieldsHelpBinding.filter(this._ifkeysFilters);
			oKeyfieldsHelpBinding.requestContexts(0, Infinity, "keyfield").then(function (aContext) {
				aContext.forEach(function (oContext) {
					var oData = oContext.getObject();
					this.oFilterBarDelegate.addHelpData(oData);
				}.bind(this));
				this.oFilterBarDelegate.loadHelpDialogs();
			}.bind(this));
			this._oMessageModel.submitBatch("keyfield");
		},
		_showRejectError: function (oRejectReason) {
			MessageBox.error(oRejectReason.statusCode + ": " + oRejectReason.message);

		},
		_addKeyfields: function (oKeyfield) {
			this.oFilterBarDelegate.loadKeyfieldFilter(oKeyfield);
			// table
			var sTextText = "_Text";
			var sColumnText = "_Column";
			var sTextId = this._oView.createId(sTextText + oKeyfield.FieldName);
			var oText = new sap.m.Text(sTextId, {
				customData: [new sap.ui.core.CustomData({
					key: "FieldName",
					value: oKeyfield.FieldName
				})]
			});
			oText.bindProperty("text", {
				path: "KeyFields",
				formatter: this.getvalue.bind(oText)
			});
			var sColumnId = this._oView.createId(sColumnText + oKeyfield.FieldName);
			var oColumn = new sap.ui.table.Column(sColumnId, {
				sortProperty: "KeyFields",
				label: this.formatter.getFieldLabel(oKeyfield.Label, oKeyfield.FieldName),
				template: oText
			});
			var oMenu = oColumn.getMenu();
			oMenu.attachItemSelect(this.onSortMenuSelected, this);
			oMenu.data("KeyFieldName", oKeyfield.FieldName);
			this._oTable.insertColumn(oColumn, this._iKeyfieldColumnIndex);
			this._iKeyfieldColumnIndex += 1;
			//this._bindTable();
		},
		onSortMenuSelected: function (oEvent) {
			var oMenu = oEvent.getSource();
			var oItem = oEvent.getParameter("item");
			var sItemId = oItem.getId();
			var sIsDesc = "";
			if (sItemId.endsWith("desc")) {
				sIsDesc = "X";
			}
			this._aOrderedFieldName = [{
				NAME: oMenu.data("KeyFieldName"),
				DESCENDING: sIsDesc,
				ASTEXT: ""
			}];
			this.onSearch(oEvent);
		},
		onChangeRow: function (oEvent) {
			var oReason = oEvent.getParameter("reason");
			if (oReason === "change" || oReason === "filter") {
				var oBinding = this._oTable.getBinding("rows");
				var vCount = oBinding.getLength();
				var sTitleText = this._oI18nModel.getResourceBundle().getText("messageListTitle");
				var sText = this._sNs + "/" + this._sIfname + "/" + this._sIfver + " - " + sTitleText + "(" + vCount.toString() + ")";
				this.getView().byId("tabTitle").setText(sText);
			}
		},
		//Restart selected messages
		onRestartMessage: function () {
			var oI18n = this._oI18nModel.getResourceBundle();
			var aSelI = this._oTable.getSelectedIndices();
			var aValidMessage = [];
			if (aSelI.length === 0) {
				MessageToast.show(oI18n.getText("messageSelecMessage"));
				return;
			}
			for (var i = 0; i < aSelI.length; i++) {
				var oBindingData = this._oTable.getContextByIndex(aSelI[i]).getObject();
				if (["E", "A", "I"].includes(oBindingData.Status)) {
					aValidMessage.push(aSelI[i]);
				}
			}
			if (aValidMessage.length === 0) {
				MessageToast.show(oI18n.getText("messageSelecValidMessage"));
				return;
			}
			MessageBox.show(
				oI18n.getText("confirmRestartMessage"), {
				icon: MessageBox.Icon.QUESTION,
				title: oI18n.getText("titleRestartMessage"),
				actions: [oI18n.getText("buttonConfirmRestartMessage"), MessageBox.Action.CANCEL],
				initialFocus: MessageBox.Action.CANCEL,
				onClose: this._handleRestartMessage.bind(this)
				//onClose: this._bSelectAll === true ? this._massProcessCheck.bind(this) : this._handleRestartMessage.bind(this)
			}
			);
		},
		_handleRestartMessage: function (sAction) {
			var i18n = this._oI18nModel.getResourceBundle();
			if (sAction === i18n.getText("buttonConfirmRestartMessage")) {
				var aSuccessMessage = [];
				var aErrorMessage = [];
				var aPromise = [];
				var aSelI = this._oTable.getSelectedIndices();
				aSelI.forEach(function (iIdx) {
					var oBindingData = this._oTable.getContextByIndex(iIdx).getObject();
					if (["E", "A", "I"].includes(oBindingData.Status)) {
						aPromise.push(new Promise(function (resolve, reject) {
							var sKeyUrl = "MessageGuid='" + oBindingData.MessageGuid + "',Namespace='" + encodeURL(oBindingData.Namespace) +
								"',InterfaceName='" +
								encodeURL(oBindingData.InterfaceName) + "',InterfaceVersion='" + encodeURL(oBindingData.InterfaceVersion);
							var sActionUrl = "/MessageKeySet(" + sKeyUrl + "')" +
								"/com.sap.gateway.default.aif.messagehandling.v0001.MessageRestart(...)";
							this._oMessageModel.bindContext(sActionUrl, this._oTable.getContextByIndex(iIdx)).execute()
								.then(
									function () {
										aSuccessMessage.push(iIdx);
										resolve();
									}.bind(this),
									function (oError) {
										aErrorMessage.push(iIdx);
										reject(oError);
									});
						}.bind(this)));
					}
				}.bind(this));
				Promise.all(aPromise).finally(function () {
					var msg = i18n.getText("messageRestartSuccess", [aSuccessMessage.length]);
					MessageToast.show(msg);
					aSuccessMessage.forEach(function (iIdx) {
						var oBindingData = this._oTable.getContextByIndex(iIdx);
						oBindingData.setProperty("Status", "I");
					}.bind(this));
				}.bind(this));
			}
			// this.onSearch();
		},

		onTableSetting: function (oEvent) {
			this._oTablePersonal.openDialog();
		},

		// Cancel selected messages
		onCancelMessage: function () {
			var oI18n = this._oI18nModel.getResourceBundle();
			var aSelI = this._oTable.getSelectedIndices();
			var aValidMessage = [];
			if (aSelI.length === 0) {
				MessageToast.show(oI18n.getText("messageSelecMessage"));
				return;
			}
			for (var i = 0; i < aSelI.length; i++) {
				var oBindingData = this._oTable.getContextByIndex(aSelI[i]).getObject();
				if (["E", "A", "I"].includes(oBindingData.Status)) {
					aValidMessage.push(aSelI[i]);
				}
			}
			if (aValidMessage.length === 0) {
				MessageToast.show(oI18n.getText("messageSelecValidMessage"));
				return;
			}
			MessageBox.show(
				oI18n.getText("confirmCancelMessage"), {
				icon: MessageBox.Icon.QUESTION,
				title: oI18n.getText("titleCancelMessage"),
				actions: [oI18n.getText("buttonConfirmCancelMessage"), MessageBox.Action.CANCEL],
				initialFocus: MessageBox.Action.CANCEL,
				onClose: this._handleCancelMessage.bind(this)
				//onClose: this._bSelectAll === true ? this._massProcessCheck.bind(this) : this._handleCancelMessage.bind(this)
			}
			);
		},
		_handleCancelMessage: function (sAction) {
			var i18n = this._oI18nModel.getResourceBundle();
			if (sAction === i18n.getText("buttonConfirmCancelMessage")) {
				var aSuccessMessage = [];
				var aErrorMessage = [];
				var aPromise = [];
				var aSelI = this._oTable.getSelectedIndices();
				aSelI.forEach(function (iIdx) {
					var oBindingData = this._oTable.getContextByIndex(iIdx).getObject();
					if (["E", "A", "I"].includes(oBindingData.Status)) {
						aPromise.push(new Promise(function (resolve, reject) {
							var sKeyUrl = "MessageGuid='" + oBindingData.MessageGuid + "',Namespace='" + encodeURL(oBindingData.Namespace) +
								"',InterfaceName='" +
								encodeURL(oBindingData.InterfaceName) + "',InterfaceVersion='" + encodeURL(oBindingData.InterfaceVersion);
							var sActionUrl = "/MessageKeySet(" + sKeyUrl + "')" +
								"/com.sap.gateway.default.aif.messagehandling.v0001.MessageCancel(...)";
							this._oMessageModel.bindContext(sActionUrl, this._oTable.getContextByIndex(iIdx)).execute()
								.then(
									function () {
										aSuccessMessage.push(iIdx);
										resolve();
									}.bind(this),
									function (oError) {
										aErrorMessage.push(iIdx);
										reject(oError);
									});
						}.bind(this)));
					}
				}.bind(this));
				Promise.all(aPromise).finally(function () {
					var msg = i18n.getText("messageCancelSuccess", [aSuccessMessage.length]); //iMessageCount + ' messages have been canceled';
					MessageToast.show(msg);
					aSuccessMessage.forEach(function (iIdx) {
						var oBindingData = this._oTable.getContextByIndex(iIdx);
						oBindingData.setProperty("Status", "C");
						// oBindingData.refresh();
					}.bind(this));
				}.bind(this));
			}
			// this.onSearch();
		},
		/***********************************Mass restart/cancel process begin***********************************/
		onSelectionChange: function (oEvent) {
			this._bSelectAll = oEvent.getParameter("selectAll"); //Store table select all flag
			if (this._oTable.getSelectedIndices().length > 0) {
				this.getView().byId("buttonRestartMessage").setEnabled(true);
				this.getView().byId("buttonCancelMessage").setEnabled(true);
			} else {
				this.getView().byId("buttonRestartMessage").setEnabled(false);
				this.getView().byId("buttonCancelMessage").setEnabled(false);
			}
		},
		_massProcessCheck: function (sAction) {
			var i18n = this._oI18nModel.getResourceBundle();
			switch (sAction) {
				case i18n.getText("buttonConfirmRestartMessage"): //Cancel in all
					this._massProcess("R");
					break;
				case i18n.getText("buttonConfirmCancelMessage"): //Restart in all
					this._massProcess("C");
					break;

			}
		},
		_massProcess: function (sAction) {
			var serviceUrl = this._oMessageModel.sServiceUrl;
			var oTableBinding = this._oTable.getBinding("rows");
			var sPath = oTableBinding.getPath().replace('/', '');
			var sFilter = encodeURIComponent(oTableBinding.mCacheQueryOptions.$filter + " and MassProcess eq 'X'");
			var sapClient = '';
			var regclient = /sap-client=\d{3}/g;
			var client;
			if ((client = regclient.exec(location.href)) !== null) {
				sapClient = client[0];
			}
			var sQuery = sapClient === '' ? sPath + '?$filter=' + sFilter : sPath + '?' + sapClient + '&$filter=' + sFilter;
			var sMassRestart = sapClient === '' ? 'MassProcess' : 'MassProcess?' + sapClient;
			var sMassRestartData = {
				ActionCode: sAction,
				MassProcessContext: ''
			};

			this._oView.setBusy(true);
			var oView = this._oView;
			if (this._oBatchCall === undefined) {
				var MassProcessCall = sap.ui.requireSync(['nw/core/aif/a/messagemonitoring/util/MassProcessCall']);
				this._oBatchCall = new MassProcessCall(serviceUrl);
			}
			this._oBatchCall.callBatch({
				data: [{
					type: 'GET',
					url: sQuery
				}, {
					type: 'POST',
					url: sMassRestart,
					data: sMassRestartData
				}],
				complete: function (xhr, status, data) {
					oView.setBusy(false);
					var retMessage = data[1].data.value[0].MESSAGE;
					MessageToast.show(retMessage);
				}.bind(this)
			});
		},
		/***********************************Mass restart/cancel process end********************************/

		/***********************************Navigation begin********************************/
		onNavigation: function (oEvent) {
			var oRow = oEvent.getParameter("row");
			var oMessageDetail = {
				ns: this._sNs,
				ifname: this._sIfname,
				ifver: this._sIfver,
				msgguid: oRow.getBindingContext().getObject().MessageGuid,
				icon: oRow.getCells()[0].getIcon()
			};
			var oMessageDetailModel = new JSONModel(oMessageDetail);
			var oParaModel = sap.ui.getCore().getModel("MessageDetail");
			if (oParaModel !== undefined) {
				oParaModel.destroy(true);
			}
			sap.ui.getCore().setModel(oMessageDetailModel, "MessageDetail");

			var oRouter = UIComponent.getRouterFor(this);
			oRouter.navTo("messageDetail");
		},
		_addNavigation: function () {
			var fnNavigation = this.onNavigation.bind(this);
			var oRowActionTemplate = new sap.ui.table.RowAction({
				items: [
					new sap.ui.table.RowActionItem({
						type: "Navigation",
						press: fnNavigation,
						visible: !this._oUIControModel.getProperty("/isTechnicalInterface")
					})
				]
			});

			this._oTable.setRowActionTemplate(oRowActionTemplate);
			this._oTable.setRowActionCount(1);
		}
		/***********************************Navigation end********************************/
	});
});