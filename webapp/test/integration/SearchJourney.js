/* global QUnit */

sap.ui.define([
	"sap/ui/test/Opa5",
	"sap/ui/test/opaQunit",
	"nw/core/aif/a/messagemonitoring/test/integration/pages/RestartMessages"
], function (Opa5, opaTest) {
	

	QUnit.module("Message Monitoring Page Testing");
	
	QUnit.module("Test select messages");
	opaTest("select one message:", function (Given, When, Then) {
		// Arrangements
		Given.iStartMyApp();
		//Actions: select one message
		When.onTheMessagePage.iPressTheTableSelection();
		// Assertions:selected
		Then.onTheMessagePage.iShouldSeeOneMessageSelected();
		// Cleanup
		Then.iTeardownMyApp();
	});
	QUnit.module("Test restart selected message");
	opaTest("select and restart message", function (Given, When, Then) {
		// Arrangements
		Given.iStartMyApp();

		//Actions
		When.onTheMessagePage.iWaitForRestartCancelButtons();
		// Assertions
		Then.onTheMessagePage.iShouldSeeAllButtons();
		//Actions: click 'Restart message' button
		// When.onTheMessagePage.iPressTheRestartMessageButton();
		// // Assertions
		// Then.onTheMessagePage.iShouldSeeTheRestartMessageDialog();	
		
     	// Cleanup
		Then.iTeardownMyApp();
	});
	// QUnit.module("Test cancel selected message");
	// opaTest("select and restart message", function (Given, When, Then) {
	// 	// Arrangements
	// 	Given.iStartMyApp();

	// 	//Actions
	// 	When.onTheMessagePage.iWaitForRestartCancelButtons();
	// 	// Assertions
	// 	Then.onTheMessagePage.iShouldSeeAllButtons();
	// 	//Actions: click 'Restart message' button
	// 	When.onTheMessagePage.iPressTheRestartMessageButton();
	// 	// Assertions
	// 	Then.onTheMessagePage.iShouldSeeTheRestartMessageDialog();	
		
 //    	// Cleanup
	// 	Then.iTeardownMyApp();
	// });
	// QUnit.module("Test mass process of selected messages");
	// opaTest("select and restart message", function (Given, When, Then) {
	// 	// Arrangements
	// 	Given.iStartMyApp();

	// 	//Actions
	// 	When.onTheMessagePage.iWaitForRestartCancelButtons();
	// 	// Assertions
	// 	Then.onTheMessagePage.iShouldSeeAllButtons();
	// 	//Actions: click 'Restart message' button
	// 	When.onTheMessagePage.iPressTheRestartMessageButton();
	// 	// Assertions
	// 	Then.onTheMessagePage.iShouldSeeTheRestartMessageDialog();	
		
 //    	// Cleanup
	// 	Then.iTeardownMyApp();
	// });
});