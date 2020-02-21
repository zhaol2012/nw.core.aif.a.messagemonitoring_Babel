sap.ui.define([
	"nw/core/aif/a/messagemonitoring/localService/mockserver_new",
	"sap/ui/test/TestUtils",
	"sap/ui/thirdparty/sinon-4"
], function (mockserver, TestUtils, sinon4) {
	

	var oMockData = {
		mFixture: {
			"$metadata": { source: "metadata.xml" },
			'KeyFieldsSet?%24filter=Namespace+eq+%27X180_0%27+and+InterfaceName+eq+%27STS_MGR_3%27+and+InterfaceVersion+eq+%271.0.0%27': { source: "KeyFieldsSet.json" },
			"KeyFieldsSet?$filter=Namespace eq 'X180_0' and InterfaceName eq 'STS_MGR_3' and InterfaceVersion eq '1.0.0'": { source: "KeyFieldsSet.json" },
			"IndexTableGenericSet?$count=true&$filter=Namespace%20eq%20'X180_0'%20and%20InterfaceName%20eq%20'STS_MGR_3'%20and%20InterfaceVersion%20eq%20'1.0.0'%20and%20ProcessDate%20ge%201970-01-01T08:00:00Z%20and%20ProcessDate%20le%209901-01-01T12:00:00Z%20and%20Status%20eq%20'I'&$skip=0&$top=113": {
				source: "X180_0-STS_MGR_3-1.0.0.json"
			}
		},
		sFilterBase: "/sap/opu/odata4/aif/msgmonitoring_api/default/aif/messagehandling/0001/",
		sSourceBase: "nw/core/aif/a/messagemonitoring/localService/mockdata_new"
	};

	/* 	var oMockServer = new mockserver(oMockData);
		oMockServer.start(); */

	var oSandbox = sinon4.sandbox.create();
	TestUtils.setupODataV4Server(oSandbox, oMockData.mFixture,
		oMockData.sSourceBase, oMockData.sFilterBase);
	sap.ui.require(["sap/ui/core/ComponentSupport"]);
});