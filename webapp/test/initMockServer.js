sap.ui.define([
	"nw/core/aif/a/messagemonitoring/localService/mockserver"
], function (mockserver) {
	
	mockserver.init();
	sap.ui.require(["sap/ui/core/ComponentSupport"]);
});