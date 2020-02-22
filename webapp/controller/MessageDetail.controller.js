sap.ui.define([
    "sap/ui/core/mvc/Controller"
], function (Controller) {

    return Controller.extend("nw.core.aif.a.messagemonitoring.controller.MessageDetail", {
        onInit: function () {
            // Set global fields
            this._oView = this.getView();
            this._oI18nModel = this.getOwnerComponent().getModel("i18n");
            this._oView.setModel(this._oI18nModel, "i18n");

            var oRouter = this.getOwnerComponent().getRouter();
            oRouter.attachRouteMatched(function (oEvent) {
                if (oEvent.getParameter("name") === "messageDetail") {
                    // Get message detail context
                    var oMessageDetailModel = sap.ui.getCore().getModel("MessageDetail");
                    // Set the model for every navigation to get the latest data
                    this._oView.setModel(oMessageDetailModel, "MD");

                } else {


                }
            }.bind(this));
        },

		/**
		 * The Event handler for editing message content.
		 * @param  {sap.ui.base.Event} oEvent the message content editing event
		 * @public 
		 */
        onEditContent: function (oEvent) {

        },
		/**
		 * The Event handler for restarting message.
		 * @param  {sap.ui.base.Event} oEvent the message restarting event
		 * @public 
		 */
        onRestartMessage: function (oEvent) {

        },
        /**
         * The event handler for canceling message.
         * @param  {sap.ui.base.Event} oEvent the message canceling event
         * @public 
         */
        onCancelMessage: function (oEvent) {

        },
        /**
         * The event handler for downloading message content.
         * @param  {sap.ui.base.Event} oEvent the message content downloading event
         * @public 
         */
        onDownloadMessage: function (oEvent) {

        }
    });
});