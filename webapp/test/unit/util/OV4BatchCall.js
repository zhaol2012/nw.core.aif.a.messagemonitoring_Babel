sap.ui.define([
	"nw/core/aif/a/messagemonitoring/util/OV4BatchCall",
	"sap/ui/thirdparty/sinon-4"
], function (OV4BatchCall, sinon4) {
	
	//var oBatchCall = new OV4BatchCall('/sap/opu/odata4/aif/msgmonitoring_api/default/aif/messagehandling/0001/');
	//	var oBatchCall;
	QUnit.module("Odata V4 Batch Call", {
		beforeEach: function () {
			this._oBatchCall = new OV4BatchCall('/sap/opu/odata4/aif/msgmonitoring_api/default/aif/messagehandling/0001/');

			/*			this.xhr = sinon4.useFakeXMLHttpRequest();
						var requests = this.requests = [];

						this.xhr.onCreate = function (xhr) {
							requests.push(xhr);
						};*/

			//	this.server = sinon4.createFakeServer();
		},
		afterEach: function () {
			this._oBatchCall.destroy();
			//this.xhr.restore();
			//	this.server.restore();
		}
	});

	QUnit.test('Should generate correct hexadecimal value', function (assert) {
		var regexp = /^[0-9a-fA-F]+$/;
		var hexValue = this._oBatchCall.hex16();

		assert.strictEqual(regexp.test(hexValue), true, 'The geneted value was hexadecimal');
		assert.strictEqual(hexValue.length, 4, 'The lenght of geneted value was 4');
	});

	QUnit.test('Should generate correct batch flag', function (assert) {
		var regexp = /^batch_[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}$/;
		var batchFlag = this._oBatchCall.createFlag("batch_");

		assert.strictEqual(regexp.test(batchFlag), true, 'The geneted batch flag was correct');
	});

	QUnit.test('Should generate correct changeset flag', function (assert) {
		var regexp = /^changeset_[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}$/;
		var batchFlag = this._oBatchCall.createFlag("changeset_");

		assert.strictEqual(regexp.test(batchFlag), true, 'The geneted changeset flag was correct');
	});

	QUnit.test('Should pack correct request body', function (assert) {
		var queryUrl = "IndexTableGenericSet?$filter=Namespace%20eq%20'X180_0'%20and%20InterfaceName%20eq%20'STS_MGR_9'%20and%20" +
			"InterfaceVersion%20eq%20'1.0.0'%20and%20ProcessDate%20ge%201970-01-01T08%3A00%3A00Z%20and%20" +
			"ProcessDate%20le%209901-01-01T12%3A00%3A00Z%20and%20Status%20eq%20'I'%20and%20MassProcess%20eq%20'X'";
		var batchFlag = "batch_5df7-e122-817a";
		var changesetFlag = "changeset_cf33-532b-05e5";
		var expectedArray = [];
		expectedArray.push('--' + batchFlag);
		expectedArray.push('Content-Type: application/http');
		expectedArray.push('Content-Transfer-Encoding: binary', '\r\n');
		expectedArray.push('GET ' + queryUrl + ' HTTP/1.1');
		expectedArray.push('Accept:application/json;odata.metadata=minimal;IEEE754Compatible=true');
		expectedArray.push('Content-Type:application/json;charset=UTF-8;IEEE754Compatible=true', '\r\n', '\r\n');
		expectedArray.push('--' + batchFlag);
		expectedArray.push('Content-type: multipart/mixed; boundary=changeset_cf33-532b-05e5', '\r\n');
		expectedArray.push('--' + changesetFlag);
		expectedArray.push('Content-Type: application/http');
		expectedArray.push('Content-Transfer-Encoding: binary');
		expectedArray.push('Content-ID: 1', '\r\n');
		expectedArray.push('POST MassProcess HTTP/1.1');
		expectedArray.push('Accept:application/json;odata.metadata=minimal;IEEE754Compatible=true');
		expectedArray.push('Content-Type:application/json;charset=UTF-8;IEEE754Compatible=true', '\r\n');
		expectedArray.push('{"ActionCode":"R","MassProcessContext":""}');
		expectedArray.push('--' + changesetFlag + '--', '\r\n');
		expectedArray.push('--' + batchFlag + '--', '\r\n');
		var reqData = [{
			type: "GET",
			url: queryUrl
		}, {
			data: {
				ActionCode: "R",
				MassProcessContext: ""
			},
			type: "POST",
			url: "MassProcess"
		}];

		var localBatchCall = new OV4BatchCall('/sap/opu/odata4/aif/msgmonitoring_api/default/aif/messagehandling/0001/', batchFlag,
			changesetFlag);

		var resultBody = localBatchCall.pack(reqData);
		//	var expectedBody = expectedArray.join('').replace(/\n/gi, "\r\n");
		var expectedBody = expectedArray.join('\r\n');
		assert.strictEqual(resultBody, expectedBody,
			'The geneted batch requery body was correct');
	});

	/*	QUnit.test('jQuery.ajax should fetch x-csrf-token ', function (assert) {

			var reqUrl =
				'/sap/opu/odata4/aif/msgmonitoring_api/default/aif/messagehandling/0001/';
			var fakeData = [  ];
			this.xhr = sinon.useFakeXMLHttpRequest();
			var requests = this.requests = [];

			this.xhr.onCreate = function (xhr) {
				requests.push(xhr);
			};
			this._oBatchCall.ajaxFetchToken();
			this.requests[0].respond(200, {
				"Content-Type": "application/json",
				"x-csrf-token": "cRzr6J7M4pcb457vRKGgTQ=="
			}, JSON.stringify(fakeData));
			assert.strictEqual(this._oBatchCall.token, "cRzr6J7M4pcb457vRKGgTQ==", "The X-CSRF-TOKEN fetched successfully");
			this.xhr.restore();
		});
	*/

	QUnit.test('jQuery.ajax should fetch x-csrf-token', function (assert) {
		var reqUrl =
			'/sap/opu/odata4/aif/msgmonitoring_api/default/aif/messagehandling/0001/';
		var fakeData = [ /* ... */ ];
		this.server = sinon4.createFakeServer();
		this.server.respondWith(
			"GET",
			reqUrl, [200, {
				"Content-Type": "application/json",
				"x-csrf-token": "cRzr6J7M4pcb457vRKGgTQ=="
			}, JSON.stringify(fakeData)]
		);
		this._oBatchCall.ajaxFetchToken();
		this.server.respond();
		assert.strictEqual(this._oBatchCall.token, "cRzr6J7M4pcb457vRKGgTQ==", "The X-CSRF-TOKEN fetched successfully");
		this.server.restore();

	});

	/*	QUnit.test('jQuery.ajax should call batch', function (assert) {
			var reqUrl =
				'/sap/opu/odata4/aif/msgmonitoring_api/default/aif/messagehandling/0001/';
			var queryUrl = "IndexTableGenericSet?$filter=Namespace%20eq%20'X180_0'%20and%20InterfaceName%20eq%20'STS_MGR_9'%20and%20" +
				"InterfaceVersion%20eq%20'1.0.0'%20and%20ProcessDate%20ge%201970-01-01T08%3A00%3A00Z%20and%20" +
				"ProcessDate%20le%209901-01-01T12%3A00%3A00Z%20and%20Status%20eq%20'I'%20and%20MassProcess%20eq%20'X'";
			this._retMessage = "";
			var batchParam = {
				data: [{
					type: 'GET',
					url: queryUrl
				}, {
					type: 'POST',
					url: "MassProcess",
					data: '{"ActionCode":"R","MassProcessContext":""}'
				}],
				complete: function (xhr, status, data) {
					this._retMessage = data[1].data.value[0].MESSAGE;
				}.bind(this)
			};
			var fakeData = '';
			var rawFile = new XMLHttpRequest();
			rawFile.open("GET", "./data/batchCallResult.txt", false);
			rawFile.send(null);
			fakeData = rawFile.responseText;

			this.server = sinon4.createFakeServer();
			this.server.respondWith(
				"POST",
				reqUrl + '$batch', [200, {
					"Content-Type": "text/html",
				}, fakeData]
			);
			this._oBatchCall.ajaxBatch(batchParam);
			this.server.respond();

			assert.strictEqual(this._retMessage, "6 messages are scheduled for restart", "The mass process batch call successfully");
			this.server.restore();
		});*/

});