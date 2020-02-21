sap.ui.define([
    "sap/ui/base/Object",
    "sap/ui/thirdparty/sinon-4",
    "sap/ui/test/TestUtils",
    "nw/core/aif/a/messagemonitoring/util/TestUtils"
], function (Object, sinon4,placeholder,TestUtils) {
    
    return Object.extend("MockServerV4", {
        constructor: function (oMockData) {
            this._oMockData = oMockData;
            this._oSandbox = sinon4.sandbox.create();
        },
        start: function () {
            TestUtils.setupODataV4Server(this._oSandbox, this._oMockData.mFixture,
                this._oMockData.sSourceBase, this._oMockData.sFilterBase);
        },
        stop:function(){
            this._oSandbox.restore();
        }
    });
});