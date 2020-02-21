/* global QUnit */

QUnit.config.autostart = false;

sap.ui.getCore().attachInit(function () {
	

	sap.ui.require([
		"nw/core/aif/a/messagemonitoring/test/integration/AllJourneys"
	], function() {
		QUnit.start();
	});
});
