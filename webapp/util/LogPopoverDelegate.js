sap.ui.define([
	"sap/ui/base/EventProvider",
	"sap/ui/model/json/JSONModel",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator",
	"sap/m/MessageBox",
	"sap/m/MessageItem",
	"sap/ui/core/Fragment"
], function (EventProvider, JSONModel, Filter, FilterOperator, MessageBox, MessageItem, Fragment) {
	"use strict";
	return EventProvider.extend("nw.core.aif.a.messagemonitoring.util.LogPopoverDelegate", {
		openPopoverMessageLog: function (oEvent) {
			//determine data message key
			this._oMessageForLog = oEvent.getSource().getBindingContext().getObject();
			var oFilters = new Filter({
				filters: [
					new Filter("MessageGuid", FilterOperator.EQ, this._oMessageForLog.MessageGuid),
					new Filter("Namespace", FilterOperator.EQ, this._oMessageForLog.Namespace),
					new Filter("InterfaceName", FilterOperator.EQ, this._oMessageForLog.InterfaceName),
					new Filter("InterfaceVersion", FilterOperator.EQ, this._oMessageForLog.InterfaceVersion)
				],
				and: true
			});			
			var oPress = oEvent.getSource();
			this._fragmentIdLog = "fragmentIdLog";
			if (!this._oPopoverLog) {
				Fragment.load({
					id: this._fragmentIdLog,
					name: "nw.core.aif.a.messagemonitoring.view.fragment.MessageLogPopover",
					controller: this
				}).then(function (oPopover) {
					this._oPopoverLog = oPopover;
					this.getView().addDependent(this._oPopoverLog);
					this._oListLog = Fragment.byId(this._fragmentIdLog, "messageLogList");
					var oMessageTemplate = new MessageItem({ 
						type: {parts: [{path: "MsgType"}], formatter: this.formatter.getMessageType},
						title: "{Text}",
					    markupDescription: "{HasLongText}",
						description: "{HasLongText}"
						});

					this._oListLog.bindAggregation("items", {
						path: "/MessageLogSet",
						filters: oFilters,
						length: Infinity,
						template: oMessageTemplate,
						events: {
							dataReceived: this.oLogPopoverDelegate.onLogDataReceived.bind(this)
						}						
					});
					this._oPopoverLog.setBusy(true);
					this._oPopoverLog.openBy(oPress);
				}.bind(this));
			} else {
				this._oListLog.getBinding("items").filter(oFilters);
				this._oPopoverLog.setBusy(true);
				this._oPopoverLog.openBy(oPress);
			}
		},
		onItemSelect: function (oEvent){
			//determine selected message log item for long text
            var oItem = oEvent.getParameters().item;
            var aSelectedLogItem = oItem.getBindingContext().getObject();
            
            if (aSelectedLogItem.HasLongText){
	            //replace special characters in variables before making the URL
	            aSelectedLogItem.MsgId = encodeURIComponent(aSelectedLogItem.MsgId);
	            aSelectedLogItem.MsgNo = encodeURIComponent(aSelectedLogItem.MsgNo);
	            aSelectedLogItem.MsgV1 = encodeURIComponent(aSelectedLogItem.MsgV1);
	            aSelectedLogItem.MsgV2 = encodeURIComponent(aSelectedLogItem.MsgV2);
	            aSelectedLogItem.MsgV3 = encodeURIComponent(aSelectedLogItem.MsgV3);
	            aSelectedLogItem.MsgV4 = encodeURIComponent(aSelectedLogItem.MsgV4);
				//make URL		
				var sPathDescription = "MessageTextSet(MsgId='" + aSelectedLogItem.MsgId + "',MsgNo='" + aSelectedLogItem.MsgNo + "',MsgV1='" + aSelectedLogItem.MsgV1;
				sPathDescription = sPathDescription + "',MsgV2='" + aSelectedLogItem.MsgV2 + "',MsgV3='" + aSelectedLogItem.MsgV3 + "',MsgV4='" + aSelectedLogItem.MsgV4 + "')";
				//load long text in synchronous way
				var oDesJson = new sap.ui.model.json.JSONModel();
				oDesJson.loadData(this._sMainUrl + sPathDescription,null, false, "GET", true);
				var sLongText = oDesJson.getData().LongText;
				//reset description
	            oItem.setDescription(sLongText);
            }
		},
		onPopoverMessageLogClose: function (oEvent) {
			this._oListLog.navigateBack();
			this._oPopoverLog.close();
		},
		onLogDataReceived: function (oEvent) {
			this._oPopoverLog.setBusy(false);
		}
	});
});