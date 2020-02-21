sap.ui.define([
	"sap/ui/core/UIComponent",
	"sap/ui/Device",
	"nw/core/aif/a/messagemonitoring/model/models",
	"sap/base/util/UriParameters"
], function (UIComponent, Device, models,UriParameters) {
	

	return UIComponent.extend("nw.core.aif.a.messagemonitoring.Component", {

		metadata: {
			manifest: "json"
		},
		init: function () {
			UIComponent.prototype.init.apply(this, arguments);
			this.getRouter().initialize();
			this.setModel(models.createDeviceModel(), "device");
			/* var oComponentData = this.getComponentData();
			var oUriParameters = UriParameters.fromQuery(window.location.search);
			oComponentData.startupParameters = oUriParameters.mParams; */
		},
		getContentDensityClass : function () {
			if (!this._sContentDensityClass) {
				if (!Device.support.touch) {
					this._sContentDensityClass = "sapUiSizeCompact";
				} else {
					this._sContentDensityClass = "sapUiSizeCozy";
				}
			}
			return this._sContentDensityClass;
		}
	});
});