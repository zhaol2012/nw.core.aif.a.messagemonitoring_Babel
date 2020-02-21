/*global QUnit*/
sap.ui.define([
	"nw/core/aif/a/messagemonitoring/util/formatter",
	"sap/ui/model/resource/ResourceModel",
	"sap/ui/thirdparty/sinon-4"
], function (formatter, ResourceModel, sinon) {
	
	QUnit.module("Format Date");
	QUnit.test("Should format the Date with medium english date format", function (assert) {
		// sap.ui.getCore().getConfiguration().setLanguage("en");
		var oDate = new Date(1571363100000);
		var sDate = formatter.getFormatedDate(oDate, true);
		assert.strictEqual(sDate, "Oct 18, 2019, 1:45:00 AM", "Date Format is correct");
	});
	QUnit.module("Convert to EDM Date");
	QUnit.test("Should convert medium english date format to a Date", function (assert) {
		sap.ui.getCore().getConfiguration().setLanguage("en");
		var sDate = "Oct 18, 2019, 1:45:00 AM";
		var oDate = new Date(1571363100000);
		var oDateConvert = formatter.getConvertedDate(sDate);
		assert.strictEqual(oDate.getYear(), oDateConvert.getYear(), "Converted Date year is correct");
		assert.strictEqual(oDate.getMonth(), oDateConvert.getMonth(), "Converted Date month is correct");
		assert.strictEqual(oDate.getDay(), oDateConvert.getDay(), "Converted Date day is correct");
	});
	QUnit.module("Get EDM Date");
	QUnit.test("Should format the Date to EDM DateTimeOffset encoded URL", function (assert) {
		sap.ui.getCore().getConfiguration().setLanguage("en");
		var sDate = "2019-10-18T01:45:00Z"; /* "YYYY-MM-dd'T'hh':'mm':'ss'Z'" */
		var oDate = new Date(1571363100000);
		var sEDMDate = formatter.getEDMDate(oDate, true);
		assert.strictEqual(sEDMDate, sDate, "Converted EDM Date is correct");
	});
	QUnit.module("Get Status");
	QUnit.test("Should return correct status", function (assert) {
		var sStatus = "Error";
		var sStatusLongText = formatter.getStatusText("E");
		assert.strictEqual(sStatusLongText, sStatus, "Converted 'E' to 'Error' status is correct");
	});
	QUnit.module("Get Status state");
	QUnit.test("Should return correct status", function (assert) {
		var sState = "Error";
		var sStateDescription = formatter.getStatusState("E");
		assert.strictEqual(sStateDescription, sState, "Converted 'E' to 'Error' status state is correct");
	});
	QUnit.module("Get Status Icon");
	QUnit.test("Should return correct status icon", function (assert) {
		var sStatusIconExpected = "sap-icon://message-error";
		var sStatusIconActul = formatter.getStatusIcon("E");
		assert.strictEqual(sStatusIconExpected, sStatusIconActul, "Converted 'E' to 'sap-icon://message-error' icon is correct");
	});
	QUnit.module("Get Comment Count");
	QUnit.test("Should return correct commnent count text", function (assert) {
		this._oResourceModel = new ResourceModel({
			bundleUrl: sap.ui.require.toUrl("nw/core/aif/a/messagemonitoring") + "/i18n/i18n.properties"
		});

		var oModel = sinon.stub();
		oModel.withArgs("i18n").returns(this._oResourceModel);
		var oViewStub = {
			getModel: oModel
		};
		var oControllerStub = {
			getView: sinon.stub().returns(oViewStub)
		};
		// System under test
		var fnIsolatedFormatter = formatter.getCommentText.bind(oControllerStub);
		var sCommentCountTextExpected = "Comment (10)";
		var sCommentCountTextActul = fnIsolatedFormatter(10);
		assert.strictEqual(sCommentCountTextExpected, sCommentCountTextActul, "Comment count is correct");
		this._oResourceModel.destroy();
	});
});