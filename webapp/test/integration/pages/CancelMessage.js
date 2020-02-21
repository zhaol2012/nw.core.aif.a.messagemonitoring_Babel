sap.ui.define([
	"sap/ui/test/Opa5",
	"sap/ui/test/actions/Press",
	"sap/ui/test/actions/EnterText"
], function (Opa5, Press, EnterText) {
	
	var sViewNameSpace = "nw.core.aif.a.messagemonitoring.view.";
	var sViewName = "Messages";
	var sBtnCancelMsg = "buttonCancelMessage";
	var sMessageTableName = "messageOverviewTab";
	var oCancelButton;
	
	Opa5.createPageObjects({
		onCancelMessagePage: {
			autoWait: true,
			actions: {
				iPressCancelMessageWithNoSelection: function () {
					return this.waitFor({
						id: sBtnCancelMsg,
						viewNamespace: sViewNameSpace,
						viewName: sViewName,
						controlType: "sap.m.Button",
						success: function (oButton) {
							oCancelButton = oButton;
						},
						actions: new Press(),
						errorMessage: "Was not able to find the control with the id buttonCancelMessage"
					});
				},
				iSelectOneFinishedMessage: function () {
					return this.waitFor({
						viewNamespace: sViewNameSpace,
						viewName: sViewName,
						id: sMessageTableName,
						success: function (oTable) {
							oTable.setSelectionInterval(5, 5);
							oCancelButton.firePress();
						},
						// actions: function () {
						// 	this.iPressCancelMessage();
						// }.bind(this),
						errorMessage: "Did not find the message table on the page"
					});
				},
				iSelectOneUnfinishedMessage: function () {
					return this.waitFor({
						viewNamespace: sViewNameSpace,
						viewName: sViewName,
						id: sMessageTableName,
						success: function (oTable) {
							oTable.setSelectionInterval(1, 1);
							oCancelButton.firePress();
						},
						errorMessage: "Did not find the message table on the page"
					});
				},
				iIgnoreCancelMessage: function () {
					// return this.waitFor({
					// 	viewNamespace: sViewNameSpace,
					// 	viewName: sViewName,
					// 	id: sMessageTableName,
					// 	success: function (oTable) {
					// 		oTable.setSelectionInterval(1, 1);
					// 		oIgnoreButton.firePress();
					// 	},
					// 	errorMessage: "Did not find the message table on the page"
					// });
						return this.waitFor({
						viewNamespace: sViewNameSpace,
						viewName: sViewName,
						searchOpenDialogs: true,
						controlType: "sap.m.Button",
						success: function (aButtons) {
							if (aButtons.length === 2) {
								aButtons[1].firePress();
							}
						},
						errorMessage: "Did not find the confirm message box on the page"
					});
				},
				iConfirmCancelMessage: function () {
					return this.waitFor({
						viewNamespace: sViewNameSpace,
						viewName: sViewName,
						searchOpenDialogs: true,
						controlType: "sap.m.Button",
						success: function (aButtons) {
							if (aButtons.length === 2) {
								aButtons[0].firePress();
							}
						},
						errorMessage: "Did not find the confirm message box on the page"
					});
				}
			},
			assertions: {
				iCheckSelectNoMessageToast: function () {
					return this.waitFor({
						pollingInterval: 100,
						viewNamespace: sViewNameSpace,
						viewName: sViewName,
						check: function () {
							return sap.ui.test.Opa5.getJQuery()(".sapMMessageToast")[0].innerText === "Please select at least one message";
							//return !!sap.ui.test.Opa5.getJQuery()(".sapMMessageToast").length;
						},
						success: function () {
							Opa5.assert.ok(true, "Cancel Message Test: The cancel message button is defined");
							Opa5.assert.ok(true, "Cancel Message Test: Select no message, display information in message toast");
						},
						errorMessage: "Cancel Message Test: Select no message information NOT displayed"
					});
				},
				iCheckFinishedMessageToast: function () {
					return this.waitFor({
						pollingInterval: 100,
						viewNamespace: sViewNameSpace,
						viewName: sViewName,
						check: function () {
							return sap.ui.test.Opa5.getJQuery()(".sapMMessageToast")[1].innerText === "Please select at least one incompleted message";
						},
						success: function () {
							Opa5.assert.ok(true, "Cancel Message Test: Cancel finished message, display information in message toast");
						},
						errorMessage: "Cancel Message Test: Cancel finished message, information NOT display in message toast"
					});
				},
				iCheckCancelMessageConfirmBox: function () {
					return this.waitFor({
						//pollingInterval: 100,
						viewNamespace: sViewNameSpace,
						viewName: sViewName,
						searchOpenDialogs: true,
						controlType: "sap.m.Button",
						success: function (aButtons) {
							if (aButtons.length === 2) {
								Opa5.assert.ok(true, "Cancel Message Test: Confirm message box be displayed");
								//aButtons[1].firePress();
								//aButtons[1].$().trigger("tap");
							}
						},
						// check: function () {
						// 	return sap.ui.test.Opa5.getJQuery()(".sapMMessageToast")[1].innerText === "Please select at least one incompleted message";
						// 	//return !!sap.ui.test.Opa5.getJQuery()(".sapMMessageToast").length;
						// },
						errorMessage: "Cancel Message Test: Confirm message box NOT displayed"
					});
				},
				iCheckMessageStatusNotChanged: function () {
					return this.waitFor({
						viewNamespace: sViewNameSpace,
						viewName: sViewName,
						id: sMessageTableName,
						check: function (oTable) {
							return oTable.getContextByIndex(1).getObject().Status === "E";
							//return !!sap.ui.test.Opa5.getJQuery()(".sapMMessageToast").length;
						},
						success: function () {
							Opa5.assert.ok(true, "Cancel Message Test: Ignore cancel message, message status not changed");
							oCancelButton.firePress();
						},
						errorMessage: "Cancel Message Test: Ignore cancel message not selected"
					});
				},
				iCheckMessageStatusChanged: function () {
					return this.waitFor({
						viewNamespace: sViewNameSpace,
						viewName: sViewName,
						id: sMessageTableName,
						check: function (oTable) {
							return oTable.getContextByIndex(1).getObject().Status === "E";
						},
						success: function () {
							Opa5.assert.ok(true, "Cancel Message Test: Confirm cancel message, message status changed");
						},
						errorMessage: "Cancel Message Test: Confirm cancel message, message status NOT changed"
					});
				}
			}
		}
	});
	
});
