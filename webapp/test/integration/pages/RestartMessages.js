sap.ui.require([
	"sap/ui/test/Opa5",
	"sap/ui/test/matchers/AggregationLengthEquals",
	"sap/ui/test/matchers/AggregationFilled",
	"sap/ui/test/matchers/PropertyStrictEquals",
	"sap/ui/test/actions/EnterText",
	"sap/ui/test/actions/Press",
	"jquery.sap.global"
], function (Opa5, AggregationLengthEquals, AggregationFilled, PropertyStrictEquals, EnterText, Press,
	jQuery) {
	

	var sViewNameSpace = "nw.core.aif.a.messagemonitoring.view.";
	var sViewName = "Messages";
	var sBtnRestartMsg = "buttonRestartMessage";
	var sBtnCancelMsg = "buttonCancelMessage";
	// var sBtnChgMsgValues = "buttonChangeMessageValues";
	// var sBtnSetProcessor = "buttonSetProcessor";
	// var sBtnSetting = "buttonSetting";

	Opa5.createPageObjects({
		onTheMessagePage: {
			actions: {
				iWaitForRestartCancelButtons: function () {
					return this.waitFor({
						//sBtnChgMsgValues, sBtnSetting
						id: [sBtnRestartMsg, sBtnCancelMsg],
						viewName: sViewName,
						viewNamespace: sViewNameSpace,
						success: function (aBtns) {
							Opa5.assert.strictEqual(aBtns.length, 2, "Found restart and cancel buttons");
						},
						errorMessage: "Did not find the expected restart and cancel buttons"
					});
				},
				iPressTheTableSelection: function () {
					return this.waitFor({
						controlType: "sap.ui.table.Table",
						// id: "messageOverviewTab",
						actions: function (oTable) {
							oTable.setSelectedIndex(1);
						},
						errorMessage: "Could not select one entry from table"
					});
				},

				iPressTheRestartMessageButton: function () {
					return this.waitFor({
						id: sBtnRestartMsg,
						viewName: sViewName,

						actions: new Press(),
						errorMessage: "Did not find the 'Restart Message' button on the Messages view"
					});
				}
			},
			assertions: {
				iShouldSeeAllButtons: function () {
					return this.waitFor({
						id: sBtnRestartMsg,
						viewNamespace: sViewNameSpace,
						viewName: sViewName,
						controlType: "sap.m.Button",
						matchers: new sap.ui.test.matchers.PropertyStrictEquals({
							name: "text",
							value: "Restart Message"
						}),
						success: function (oButton) {
							Opa5.assert.ok(true, "The Restart Message button is there.");
						},
						errorMessage: "The Restart Message button is not there."
					});
				},
				iShouldSeeOneMessageSelected: function () {
					return this.waitFor({
						id: "messageOverviewTab",
						viewNamespace: sViewNameSpace,
						viewName: sViewName,
						// controlType: "sap.ui.table.Table",
						success: function (oTable) {
							return this.waitFor({
								check: function () {
									var aSelI = oTable.getSelectedIndices();
									var iSelectedLine = aSelI[0];
									return iSelectedLine === 1;
								},
								success: function () {
									Opa5.assert.ok(true, "Selected first entry");
								},
								errorMessage: "first entry was not selected"
							});
						}
					});
				},
				iShouldSeeTheRestartMessageDialog: function () {
					return this.waitFor({
						controlType: "sap.m.MessageBox",
						success: function () {
							// we set the view busy, so we need to query the parent of the app
							Opa5.assert.ok(true, "The restart message dialog box is open");
						},
						errorMessage: "Did not find the restart message dialog box control"
					});
				}
			}
		}
	});

});