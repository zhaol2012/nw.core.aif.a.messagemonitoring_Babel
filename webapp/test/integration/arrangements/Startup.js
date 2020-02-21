sap.ui.define([
	"sap/ui/test/Opa5"
], function (Opa5) {
	

	return Opa5.extend("nw.core.aif.a.messagemonitoring.test.integration.arrangements.Startup", {

		iStartMyApp: function () {
			this.iStartMyUIComponent({
				componentConfig: {
					name: "nw.core.aif.a.messagemonitoring",
					async: true,
					manifest: true,
					settings: {
						componentData: {
							startupParameters: {
								"NS": "Z_YQ",
								"IFNAME": "FLBOOKING",
								"IFVER": "1"
							}
						}
					}
				},
				autoWait: true,
				hash: ""
			});
		}
	});
});