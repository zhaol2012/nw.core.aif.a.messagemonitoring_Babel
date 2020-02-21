sap.ui.define([
    "sap/ui/core/mvc/Controller"
], function (Controller) {


    return Controller.extend("nw.core.aif.a.messagemonitoring.controller.MessageDetail", {
        onInit: function () {
            //global fields
            this._oView = this.getView();
            this._oI18nModel = this.getOwnerComponent().getModel("i18n");
            this._oView.setModel(this._oI18nModel, "i18n");
            var oMessageDetailModel = sap.ui.getCore().getModel("MessageDetail");

            this._oView.setModel(oMessageDetailModel, "MD");

            var oRouter = this.getOwnerComponent().getRouter();
            oRouter.attachRouteMatched(function (oEvent) {
                if (oEvent.getParameter("name") === "messageDetail") {
                    oMessageDetailModel = sap.ui.getCore().getModel("MessageDetail");
                    this._oView.setModel(oMessageDetailModel, "MD");

                    /*       let oMessageFBox = this.byId("messgeFBox");
                          oMessageFBox.destroyContent(true); */
                } else {


                }
            }.bind(this));
        },
        //Edit the message conent
        onEditContent: function () {

        },
        //Restart the message
        onRestartMessage: function () {

        },
        //Cancel the message
        onCancelMessage: function () {

        },
        //Download the message conent
        onDownloadMessage: function () {

        }
    });
});