sap.ui.define([
	"sap/ui/base/EventProvider",
	"sap/ui/model/json/JSONModel",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator",
	"sap/m/MessageBox",
	"sap/ui/core/Fragment"
], function (EventProvider, JSONModel, Filter, FilterOperator, MessageBox, Fragment) {
	"use strict";
	return EventProvider.extend("nw.core.aif.a.messagemonitoring.util.CommentPopoverDelegate", {
		openMessageCommentPopover: function (oEvent) {
			//determine message key
			this._OMsgContext = oEvent.getSource().getBindingContext();
			this._oMessageForComment = oEvent.getSource().getBindingContext().getObject();
			var oFilters = new Filter({
				filters: [
					new Filter("MessageGuid", FilterOperator.EQ, this._oMessageForComment.MessageGuid),
					new Filter("Namespace", FilterOperator.EQ, this._oMessageForComment.Namespace),
					new Filter("InterfaceName", FilterOperator.EQ, this._oMessageForComment.InterfaceName),
					new Filter("InterfaceVersion", FilterOperator.EQ, this._oMessageForComment.InterfaceVersion)
				],
				and: true
			});
			//open message comments dialog
			var oPress = oEvent.getSource();
			this._fragmentIdComment = "fragmentIdComment";
			if (!this._oPopoverComment) {
				Fragment.load({
					id: this._fragmentIdComment,
					name: "nw.core.aif.a.messagemonitoring.view.fragment.MessageCommentPopover",
					controller: this
				}).then(function (oPopover) {
					this._oPopoverComment = oPopover;
					this.getView().addDependent(this._oPopoverComment);
					this._oListComment = Fragment.byId(this._fragmentIdComment, "messageCommentList");
					this._oListComment.getBinding("items").filter(oFilters);
					// this._oPopoverComment.setBusy(true);
					this._oPopoverComment.openBy(oPress);
				}.bind(this));
			} else {
				this._oListComment.getBinding("items").filter(oFilters);
				// this._oPopoverComment.setBusy(true);
				this._oPopoverComment.openBy(oPress);
			}
		},
		onPopoverCommentClose: function (oEvent) {
			this._oPopoverComment.close();
			
		},
		onMessageCommentPost: function (oEvent) {
			var oCommentEntry = {
				"MessageGuid": this._oMessageForComment.MessageGuid,
				"Namespace": this._oMessageForComment.Namespace,
				"InterfaceName": this._oMessageForComment.InterfaceName,
				"InterfaceVersion": this._oMessageForComment.InterfaceVersion,
				"Note": oEvent.getParameter("value")
			};
			var oContext = this._oListComment.getBinding("items").create(oCommentEntry);
			oContext.created().then( function(){ this._OMsgContext.refresh();}.bind(this));
		},
		onCommentChange: function (oEvent) {
			var iCount = this._oListComment.getBinding("items").getLength();
			var sTitle = this._oI18nModel.getResourceBundle().getText("messageCommentListTitle", [iCount]);
			this._oPopoverComment.setProperty("title", sTitle);
			// this._oPopoverComment.setBusy(false);
		}
	});
});