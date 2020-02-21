sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"sap/ui/model/json/JSONModel",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator",
	"sap/m/MessageBox",
	'sap/m/MessageToast',
	"sap/ui/core/Fragment",
	"nw/core/aif/a/messagemonitoring/util/formatter",
	"nw/core/aif/a/messagemonitoring/util/FilterBarDelegate",
	"nw/core/aif/a/messagemonitoring/util/CommentPopoverDelegate",
	"nw/core/aif/a/messagemonitoring/util/LogPopoverDelegate"
], function (Controller, JSONModel, Filter, FilterOperator, MessageBox, MessageToast, Fragment, formatter, FilterBarDelegate,
	CommentPopoverDelegate, LogPopoverDelegate) {


	return Controller.extend("nw.core.aif.a.messagemonitoring.controller.Messages", {
		onInit: function () {
			//global fields
			this._oView = this.getView();
			this._oFilterBar = this._oView.byId("messageFilterbar");
			this._oStatusText = this._oView.byId("statusText");
			this._oDynPage = this._oView.byId("dynamicPage");
			this._oTable = this.oView.byId("messageOverviewTab");
			this._oManifest = this.getOwnerComponent().getMetadata();
			this._sMainUrl = this._oManifest.getManifest()["sap.app"].dataSources.mainService.uri;
			this._oRouter = this.getOwnerComponent().getRouter();
			this._oView.addStyleClass(this.getOwnerComponent().getContentDensityClass());
			this._oMessageModel = this.getOwnerComponent().getModel();
			this._oI18nModel = this.getOwnerComponent().getModel("i18n");
			this._oCDSModel = this.getOwnerComponent().getModel("CDS");
			this._oView.setModel(this._oCDSModel, "CDS");
			this._oView.setModel(this._oMessageModel);
			this._oView.setModel(this._oI18nModel, "i18n");
			this.oFilterBarDelegate = new FilterBarDelegate(this._oFilterBar, this);

			//start up parameters, update keyfields, load fragments...
			this._bKeyfieldUpdated = false;
			this._parseStartupParameters();
			this._oFiltersModel = new JSONModel(this.oFilterBarDelegate.getFiltersObject(this._oAdditionalPara));
			this._oView.setModel(this._oFiltersModel, "Filters");
			this._oValueHelpModel = new JSONModel({});
			this._oView.setModel(this._oValueHelpModel, "ValueHelp");
			this._updateKeyfields();
			this._loadFragment();
			this._addNavigation();
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
						.concat(this.oFilterBarDelegate.getStandardFilters(this._oFiltersModel.getProperty("/")))
						.concat(this.oFilterBarDelegate.getKeyfieldsFilters(this.filterControl));
					oTableBinding.filter(aFilters);
				} else {
					this._bindTable();
				}
				if (this._oStatusText && this._oFilterBar) {
					var sText = this._oFilterBar.retrieveFiltersWithValuesAsText();
					this._oStatusText.setText(sText);
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
		_loadFragment: function () {
			Fragment.load({
				name: "nw.core.aif.a.messagemonitoring.view.fragment.SingleValueHelp",
				controller: this
			}).then(function (oDialog) {
				this._singleValueHelpDialog = oDialog;
				this.getView().addDependent(this._singleValueHelpDialog);
			}.bind(this), this._showRejectError.bind(this));
		},
		_bindTable: function () {
			var aFilters = this._ifkeysFilters.slice(0)
				.concat(this.oFilterBarDelegate.getStandardFilters(this._oFiltersModel.getProperty("/")))
				.concat(this.oFilterBarDelegate.getKeyfieldsFilters(this.filterControl));
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
						var oDateFrom = this.formatter.parseEDMDate(decodeURIComponent(oPara.FROM));
						if (oDateFrom) {
							this._oAdditionalPara.from = this.formatter.getFormatedDate(oDateFrom);
						}
					}
					if (oPara.TO) {
						var oDateTo = this.formatter.parseEDMDate(decodeURIComponent(oPara.TO));
						if (oDateTo) {
							this._oAdditionalPara.to = this.formatter.getFormatedDate(oDateTo);
						}
					}
					if (oPara.STATUS) {
						this._oAdditionalPara.statusValues = [decodeURIComponent(oPara.STATUS)];
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
			if (!this._bKeyfieldUpdated) {
				//for key fields
				this.oKeyfieldsJson = new sap.ui.model.json.JSONModel();
				this.oKeyfieldsJson.loadData(
					this._sMainUrl + "KeyFieldsSet", {
					"$filter": "Namespace eq '" +
						this._sNs + "' and InterfaceName eq '" +
						this._sIfname + "' and InterfaceVersion eq '" +
						this._sIfver + "'"
				}, true, "GET", true).then(
					this._addKeyfields.bind(this));

			}
		},
		_showRejectError: function (oRejectReason) {
			MessageBox.error(oRejectReason.statusCode + ": " + oRejectReason.message);

		},
		_addKeyfields: function () {
			var oKeyData = this.oKeyfieldsJson.getData();
			this._bKeyfieldUpdated = true;
			if (!jQuery.isEmptyObject(oKeyData)) {
				var aKeyfields = oKeyData.value;
			} else {
				aKeyfields = [];
			}
			var index = 4;

			aKeyfields.forEach(function (oKeyfield) {
				// filterbar
				this.oFilterBarDelegate.loadKeyfieldFilter(oKeyfield);
				// table
				var oText = new sap.m.Text({
					customData: [new sap.ui.core.CustomData({
						key: "FieldName",
						value: oKeyfield.FieldName
					})]
				});
				oText.bindProperty("text", {
					path: "KeyFields",
					formatter: this.getvalue.bind(oText)
				});
				this._oTable.insertColumn(new sap.ui.table.Column({
					label: this.formatter.getFieldLabel(oKeyfield.Label, oKeyfield.FieldName),
					template: oText
				}), index);
				index = index + 1;
			}.bind(this));
			this._bindTable();
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

		onNavigation: function () {

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
				onClose: this._bSelectAll === true ? this._massProcessCheck.bind(this) : this._handleRestartMessage2.bind(this)
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
							var sKeyUrl = "MessageGuid='" + oBindingData.MessageGuid + "',Namespace='" + oBindingData.Namespace + "',InterfaceName='" +
								oBindingData.InterfaceName + "',InterfaceVersion='" + oBindingData.InterfaceVersion;
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
		_handleRestartMessage2: async function (sAction) {
			var i18n = this._oI18nModel.getResourceBundle();
			if (sAction === i18n.getText("buttonConfirmRestartMessage")) {
				var aSuccessMessage = [];
				var aErrorMessage = [];

				var aSelI = this._oTable.getSelectedIndices();
				var aCandidateMessage = this._oTable.getSelectedIndices().map(iIdx => {
					return { "data": this._oTable.getContextByIndex(iIdx).getObject(), "iIdx": iIdx }
				}).filter(oBindingData =>
					["E", "A", "I"].includes(oBindingData.data.Status));
				await Promise.all(aCandidateMessage.map(async oBindingData => {
					var sKey = `MessageGuid='${oBindingData.data.MessageGuid}',Namespace='${oBindingData.data.Namespace}',` +
						`InterfaceName='${oBindingData.data.InterfaceName}',InterfaceVersion='${oBindingData.data.InterfaceVersion}'`;
					var sAction = `/MessageKeySet(${sKey})/com.sap.gateway.default.aif.messagehandling.v0001.MessageCancel(...)`;
					try {
						await this._oMessageModel.bindContext(sAction, this._oTable.getContextByIndex(oBindingData.iIdx)).execute();
						this._oTable.getContextByIndex(oBindingData.iIdx).setProperty("Status", "I");
						aSuccessMessage.push(oBindingData.iIdx);
					} catch (error) {
						aErrorMessage.push(oBindingData.iIdx);
					}
				}));

				/* 				await Promise.all(aSelI.map(async iIdx => {
									var oBindingData = this._oTable.getContextByIndex(iIdx).getObject();
									if (["E", "A", "I"].includes(oBindingData.Status)) {
										var sKeyUrl = "MessageGuid='" + oBindingData.MessageGuid + "',Namespace='" + oBindingData.Namespace + "',InterfaceName='" +
											oBindingData.InterfaceName + "',InterfaceVersion='" + oBindingData.InterfaceVersion;
										var sActionUrl = "/MessageKeySet(" + sKeyUrl + "')" +
											"/com.sap.gateway.default.aif.messagehandling.v0001.MessageRestart(...)";
										try {
											await this._oMessageModel.bindContext(sActionUrl, this._oTable.getContextByIndex(iIdx)).execute();
											this._oTable.getContextByIndex(iIdx).setProperty("Status", "I");
											aSuccessMessage.push(iIdx);
										} catch (error) {
											aErrorMessage.push(iIdx);
										}
									}
								})); */
				var msg = i18n.getText("messageRestartSuccess", [aSuccessMessage.length]);
				MessageToast.show(msg);

				/* 				aSuccessMessage.forEach(iIdx => {
										var oBindingData = this._oTable.getContextByIndex(iIdx);
									oBindingData.setProperty("Status", "C"); 
									aCandidateMessage[iIdx].setProperty("Status", "C");
								}); */
			}
			// this.onSearch();
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
				onClose: this._bSelectAll === true ? this._massProcessCheck.bind(this) : this._handleCancelMessage2.bind(this)
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
							var sKeyUrl = "MessageGuid='" + oBindingData.MessageGuid + "',Namespace='" + oBindingData.Namespace + "',InterfaceName='" +
								oBindingData.InterfaceName + "',InterfaceVersion='" + oBindingData.InterfaceVersion;
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
		_handleCancelMessage2: async function (sAction) {
			var i18n = this._oI18nModel.getResourceBundle();
			if (sAction === i18n.getText("buttonConfirmCancelMessage")) {
				var aSuccessMessage = [];
				var aErrorMessage = [];

				var aSelI = this._oTable.getSelectedIndices();
				/* 				var aCandidateMessage = this._oTable.getSelectedIndices().map(iIdx => 
									this._oTable.getContextByIndex(iIdx).getObject()).filter(oBindingData => 
										["E", "A", "I"].includes(oBindingData.Status));
								await Promise.all(aCandidateMessage.map(async (oBindingData,iIdx) => {
									var sKey = `MessageGuid='${oBindingData.MessageGuid}',Namespace='${oBindingData.Namespace}',` +
												  `InterfaceName='${oBindingData.InterfaceName}',InterfaceVersion='${oBindingData.InterfaceVersion}'`;
									var sAction = `/MessageKeySet(${sKey})/com.sap.gateway.default.aif.messagehandling.v0001.MessageCancel(...)`;
									try {
										await this._oMessageModel.bindContext(sAction, this._oTable.getContextByIndex(iIdx)).execute();
										aSuccessMessage.push(iIdx);
									} catch (error) {
										aErrorMessage.push(iIdx);
									}
								})); */
				await Promise.all(aSelI.map(async iIdx => {
					var oBindingData = this._oTable.getContextByIndex(iIdx).getObject();
					if (["E", "A", "I"].includes(oBindingData.Status)) {
						var sKeyUrl = "MessageGuid='" + oBindingData.MessageGuid + "',Namespace='" + oBindingData.Namespace + "',InterfaceName='" +
							oBindingData.InterfaceName + "',InterfaceVersion='" + oBindingData.InterfaceVersion;
						var sActionUrl = "/MessageKeySet(" + sKeyUrl + "')" +
							"/com.sap.gateway.default.aif.messagehandling.v0001.MessageCancel(...)";
						try {
							await this._oMessageModel.bindContext(sActionUrl, this._oTable.getContextByIndex(iIdx)).execute();
							this._oTable.getContextByIndex(iIdx).setProperty("Status", "C");
							aSuccessMessage.push(iIdx);
						} catch (error) {
							aErrorMessage.push(iIdx);
						}
					}
				}));
				var msg = i18n.getText("messageCancelSuccess", [aSuccessMessage.length]);
				MessageToast.show(msg);

				/* 				aSuccessMessage.forEach(iIdx => {
										var oBindingData = this._oTable.getContextByIndex(iIdx);
									oBindingData.setProperty("Status", "C"); 
									aCandidateMessage[iIdx].setProperty("Status", "C");
								}); */
			}
			// this.onSearch();
		},
		/***********************************Mass restart/cancel process begin***********************************/
		onSelectionChange: function (oEvent) {
			this._bSelectAll = oEvent.getParameter("selectAll"); //Store table select all flag
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
				default:
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
				var OV4BatchCall = sap.ui.requireSync(['nw/core/aif/a/messagemonitoring/util/OV4BatchCall']);
				this._oBatchCall = new OV4BatchCall(serviceUrl);
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