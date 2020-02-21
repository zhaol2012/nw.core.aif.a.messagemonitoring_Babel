/*global QUnit*/

sap.ui.define([
	"sap/ui/test/opaQunit",
	"nw/core/aif/a/messagemonitoring/test/integration/pages/CancelMessage"
], function (opaTest) {
	

	QUnit.module("Cancel Message");

	opaTest("Should Handle Cancel Message User Interaction Correctly", function (Given, When, Then) {
		// Arrangements
		Given.iStartMyApp();

		// Cancel Message Test Cases:
		When.onCancelMessagePage.iPressCancelMessageWithNoSelection();
		Then.onCancelMessagePage.iCheckSelectNoMessageToast();

		When.onCancelMessagePage.iSelectOneFinishedMessage();
		Then.onCancelMessagePage.iCheckFinishedMessageToast();

		When.onCancelMessagePage.iSelectOneUnfinishedMessage();
		Then.onCancelMessagePage.iCheckCancelMessageConfirmBox();

		When.onCancelMessagePage.iIgnoreCancelMessage();
		Then.onCancelMessagePage.iCheckMessageStatusNotChanged();

		When.onCancelMessagePage.iConfirmCancelMessage();
		Then.onCancelMessagePage.iCheckMessageStatusChanged();

		// Cleanup
		Then.iTeardownMyApp();
	});

});