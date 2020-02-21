sap.ui.define([
	"sap/ui/core/util/MockServer",
	"sap/ui/model/json/JSONModel",
	"sap/base/Log",
	"sap/base/util/UriParameters"
], function (MockServer, JSONModel, Log, UriParameters) {
	

	var oMockServer,
		oMockServer2,
		_sAppPath = "nw/core/aif/a/messagemonitoring/",
		_sJsonFilesPath = _sAppPath + "localService/mockdata";

	var oMockServerInterface = {

		init: function (oOptionsParameter) {
			var oOptions = oOptionsParameter || {};

			return new Promise(function (fnResolve, fnReject) {
				var sManifestUrl = sap.ui.require.toUrl(_sAppPath + "manifest.json"),
					oManifestModel = new JSONModel(sManifestUrl);

				oManifestModel.attachRequestCompleted(function () {
					var oUriParameters = new UriParameters(window.location.href),
						// parse manifest for local metadata URI
						sJsonFilesUrl = sap.ui.require.toUrl(_sJsonFilesPath),
						oMainDataSource = oManifestModel.getProperty("/sap.app/dataSources/mainService"),
						oCdsDataSource = oManifestModel.getProperty("/sap.app/dataSources/CDSService"),
						sMetadataUrl = sap.ui.require.toUrl(_sAppPath + oMainDataSource.settings.localUri),
						sComMetadataUrl = sap.ui.require.toUrl(_sAppPath + oCdsDataSource.settings.localUri),
						// ensure there is a trailing slash
						sMockServerUrl = /.*\/$/.test(oMainDataSource.uri) ? oMainDataSource.uri : oMainDataSource.uri + "/",
						sComMockServerUrl = /.*\/$/.test(oCdsDataSource.uri) ? oCdsDataSource.uri : oCdsDataSource.uri + "/";
					// ensure the URL to be relative to the application
					sMockServerUrl = sMockServerUrl && new URI(sMockServerUrl).absoluteTo(sap.ui.require.toUrl(_sAppPath)).toString();
					sComMockServerUrl = sComMockServerUrl && new URI(sComMockServerUrl).absoluteTo(sap.ui.require.toUrl(_sAppPath)).toString();
					// create a mock server instance or stop the existing one to reinitialize
					if (!oMockServer) {
						oMockServer = new MockServer({
							rootUri: sMockServerUrl
						});
					} else {
						oMockServer.stop();
					}
					// create a mock server instance or stop the existing one to reinitialize
					if (!oMockServer2) {
						oMockServer2 = new MockServer({
							rootUri: sComMockServerUrl
						});
					} else {
						oMockServer2.stop();
					}

					// configure mock server with the given options or a default delay of 0.5s
					MockServer.config({
						autoRespond: true,
						autoRespondAfter: (oOptions.delay || oUriParameters.get("serverDelay") || 500)
					});
					// simulate all requests using mock data
					oMockServer.simulate(sMetadataUrl, {
						sMockdataBaseUrl: sJsonFilesUrl,
						bGenerateMissingMockData: true,
						aEntitySetsNames: ["IndexTableSet", "KeyFieldsSet"]
					});
					// simulate all requests using mock data
					oMockServer2.simulate(sComMetadataUrl, {
						sMockdataBaseUrl: sJsonFilesUrl,
						bGenerateMissingMockData: true,
						aEntitySetsNames: ["MessageComment"]
					});

					var aRequests = oMockServer.getRequests();

					var aNewRequest = [];
					var aRequests2 = oMockServer2.getRequests();

					var aNewRequest2 = [];
					aRequests.forEach(function (oRequest) {
						if (oRequest.path.source.includes("batch")) {
							// var oBatchFunc = oRequest.response;
							var sMockUrl = "$defaultbatchrequest";
							var sMockRoot = "/sap/opu/odata4/aif/msgmonitoring_api/default/aif/messagehandling/0001/";
							var oBatchRequest = {
								method: oRequest.method,
								path: new RegExp(".*defaultbatchrequest.*"),
								response: oRequest.response
							};
							aNewRequest.push(oBatchRequest);
							oRequest.response = function (oXhr) {
								var oResponse;
								var fnAjaxSuccess = function (data, textStatus, xhr) {
									oResponse = {
										success: true,
										data: data,
										status: textStatus,
										statusCode: xhr && xhr.status,
										responseHeaders: {
											"Content-Type": xhr && xhr.getResponseHeader("Content-Type"),
											"OData-Version": "4.0"
										}
									};
								};
								var fnAjaxError = function (xhr, textStatus, error) {
									oResponse = {
										success: false,
										data: undefined,
										status: textStatus,
										error: error,
										statusCode: xhr.status,
										errorResponse: xhr.responseText,
										responseHeaders: {
											"Content-Type": xhr && xhr.getResponseHeader("Content-Type"),
											"OData-Version": "4.0"
										}
									};
								};
								jQuery.ajax({
									type: "POST",
									async: false,
									url: sMockRoot + sMockUrl,
									headers: oXhr.requestHeaders,
									data: oXhr.requestBody,
									dataType: "text",
									success: fnAjaxSuccess,
									error: fnAjaxError
								});
								if (oResponse) {
									oResponse.data = oResponse.data.replace(/dataserviceversion: 2.0/g, "");
									oXhr.respond(202, oResponse.responseHeaders, oResponse.data);
								}
							};
							aNewRequest.push(oRequest);
						}
						if (oRequest.path.source.includes("metadata")) {
							oRequest.response = function (xhr) {

								var sMetadataUrlv4 = sap.ui.require.toUrl(_sAppPath + "localService/metadatav4.xml");
								var mHeaders = {
									"Content-Type": "application/xml;charset=utf-8",
									"OData-Version": "4.0"
								};
								var sMetadataXMLv4 = jQuery.sap.sjax({
									url: sMetadataUrlv4,
									dataType: "text"
								}).data;
								if (sMetadataXMLv4) {
									xhr.respond(200, mHeaders, sMetadataXMLv4);
								}

							}.bind(oMockServer);
							aNewRequest.push(oRequest);
						}
						if (oRequest.path.source.includes("IndexTableSet")) {
							aNewRequest.push(oRequest);
						}
					}.bind(this));
					// COMMENTS
					aRequests2.forEach(function (oRequest) {
						if (oRequest.path.source.includes("batch")) {
							// var oBatchFunc = oRequest.response;
							var sMockUrl = "$defaultbatchrequest";
							var sMockRoot = "/sap/opu/odata4/aif/msgmonitoring_cds/srvd/aif/messagemonitor/0001/";
							var oBatchRequest = {
								method: oRequest.method,
								path: new RegExp(".*defaultbatchrequest.*"),
								response: oRequest.response
							};
							aNewRequest2.push(oBatchRequest);
							oRequest.response = function (oXhr) {
								var oResponse;
								var fnAjaxSuccess = function (data, textStatus, xhr) {
									oResponse = {
										success: true,
										data: data,
										status: textStatus,
										statusCode: xhr && xhr.status,
										responseHeaders: {
											"Content-Type": xhr && xhr.getResponseHeader("Content-Type"),
											"OData-Version": "4.0"
										}
									};
								};
								var fnAjaxError = function (xhr, textStatus, error) {
									oResponse = {
										success: false,
										data: undefined,
										status: textStatus,
										error: error,
										statusCode: xhr.status,
										errorResponse: xhr.responseText,
										responseHeaders: {
											"Content-Type": xhr && xhr.getResponseHeader("Content-Type"),
											"OData-Version": "4.0"
										}
									};
								};
								jQuery.ajax({
									type: "POST",
									async: false,
									url: sMockRoot + sMockUrl,
									headers: oXhr.requestHeaders,
									data: oXhr.requestBody,
									dataType: "text",
									success: fnAjaxSuccess,
									error: fnAjaxError
								});
								if (oResponse) {
									oResponse.data = oResponse.data.replace(/dataserviceversion: 2.0/g, "");
									oXhr.respond(202, oResponse.responseHeaders, oResponse.data);
								}
							};
							aNewRequest2.push(oRequest);
						}
						if (oRequest.path.source.includes("metadata")) {
							oRequest.response = function (xhr) {

								var sMetadataUrlv4 = sap.ui.require.toUrl(_sAppPath + "localService/metadatacdsv4.xml");
								var mHeaders = {
									"Content-Type": "application/xml;charset=utf-8",
									"OData-Version": "4.0"
								};
								var sMetadataXMLv4 = jQuery.sap.sjax({
									url: sMetadataUrlv4,
									dataType: "text"
								}).data;
								if (sMetadataXMLv4) {
									xhr.respond(200, mHeaders, sMetadataXMLv4);
								}

							}.bind(oMockServer2);
							aNewRequest2.push(oRequest);
						}

						if (oRequest.path.source.includes("MessageComment")) {
							aNewRequest.push(oRequest);
						}
					}.bind(this));

					aNewRequest.push({
						method: "GET",
						path: new RegExp("IndexTableGenericSet.*"),
						response: function (oxhr) {
							var oResponse;
							var fnAjaxSuccess = function (data, textStatus, xhr) {

								oResponse = {
									success: true,
									data: data,
									status: textStatus,
									statusCode: xhr && xhr.status,
									responseHeaders: {
										"Content-Type": xhr && xhr.getResponseHeader("Content-Type"),
										"OData-Version": "4.0"
									}
								};
							};
							var fnAjaxError = function (xhr, textStatus, error) {
								oResponse = {
									success: false,
									data: undefined,
									status: textStatus,
									error: error,
									statusCode: xhr.status,
									errorResponse: xhr.responseText,
									responseHeaders: {
										"Content-Type": xhr && xhr.getResponseHeader("Content-Type"),
										"OData-Version": "4.0"
									}
								};
							};
							var xurl;
							var furl;
							xurl = oxhr.url.replace("IndexTableGenericSet", "IndexTableSet");
							furl = xurl.replace("$count=true&", "");
							jQuery.ajax({
								type: "get",
								async: false,
								url: furl,
								headers: oxhr.requestHeaders,
								data: oxhr.requestBody,
								dataType: "text",
								success: fnAjaxSuccess,
								error: fnAjaxError
							});
							if (oResponse) {

								oResponse.data = oResponse.data.replace(/dataserviceversion: 2.0/g, "");
								oResponse.data = JSON.parse(oResponse.data);
								var Odata = {
									value: oResponse.data.d.results
								};
								var Sdata = JSON.stringify(Odata);
								oxhr.respond(202, oResponse.responseHeaders, Sdata);
							}

						}.bind(oMockServer)
					});
					// compose an error response for a request
					var fnResponse = function (iErrCode, sMessage, aRequest) {
						aNewRequest.response = function (oXhr) {
							oXhr.respond(iErrCode, {
								"Content-Type": "text/plain;charset=utf-8"
							}, sMessage);
						};
					};

					// simulate metadata errors
					if (oOptions.metadataError || oUriParameters.get("metadataError")) {
						aNewRequest.forEach(function (aEntry) {
							if (aEntry.path.toString().indexOf("$metadata") > -1) {
								fnResponse(500, "metadata Error", aEntry);
							}
						});
					}
					// simulate request errors
					var sErrorParam = oOptions.errorType || oUriParameters.get("errorType"),
						iErrorCode = sErrorParam === "badRequest" ? 400 : 500;
					if (sErrorParam) {
						aNewRequest.forEach(function (aEntry) {
							fnResponse(iErrorCode, sErrorParam, aEntry);
						});
					}
					aNewRequest.push({
						method: "GET",
						path: new RegExp("KeyFieldsSet.*"),
						response: function (xhr) {
							var sEntitySetName = "KeyFieldsSet";
							var oMockData = this._oMockdata[sEntitySetName];
							var mHeaders = {
								"Content-Type": "application/json;charset=utf-8"
							};
							xhr.respond(200, mHeaders, JSON.stringify({
								value: oMockData
							}));
						}.bind(oMockServer)
					});
					//action: MessageRestart 
					aNewRequest.push({
						method: "POST",
						path: new RegExp("MessageKeySet.*MessageRestart.*"),
						response: function (xhr) {
							var oMockData = {
								"TYPE": "S",
								"ID": "/AIF/MES",
								"NUMBER": "108",
								"MESSAGE": "Message rescheduled",
								"LOG_NO": "",
								"LOG_MSG_NO": "0",
								"MESSAGE_V1": "005056AC62941EDA86C53729CB3D915C",
								"MESSAGE_V2": "",
								"MESSAGE_V3": "",
								"MESSAGE_V4": "",
								"PARAMETER": "",
								"ROW": "0 ",
								"FIELD": "",
								"SYSTEM": "",
								"MSGGUID": "005056AC62941EDA86C53729CB3D915C"
							};
							var mHeaders = {
								"Content-Type": "application/json;charset=utf-8"
							};
							xhr.respond(200, mHeaders, JSON.stringify({
								"@odata.context": "../$metadata#Collection(com.sap.gateway.default.aif.messagehandling.v0001.MessageReturn)",
								"@odata.metadataEtag": "W/\"20200114140958\"",
								value: oMockData
							}));
						}.bind(oMockServer)
					});
					//action: MessageCancel
					aNewRequest.push({
						method: "POST",
						path: new RegExp("MessageKeySet.*MessageCancel.*"),
						response: function (xhr) {
							var oMockData = {
								"TYPE": "S",
								"ID": "/AIF/MES",
								"NUMBER": "189",
								"MESSAGE": "Message was canceled manually",
								"LOG_NO": "",
								"LOG_MSG_NO": "0",
								"MESSAGE_V1": "005056AC62941EDA86C53729CB3D915C",
								"MESSAGE_V2": "",
								"MESSAGE_V3": "",
								"MESSAGE_V4": "",
								"PARAMETER": "",
								"ROW": "0 ",
								"FIELD": "",
								"SYSTEM": "",
								"MSGGUID": "005056AC62941EDA86C53729CB3D915C"
							};
							var mHeaders = {
								"Content-Type": "application/json;charset=utf-8"
							};
							xhr.respond(200, mHeaders, JSON.stringify({
								"@odata.context": "../$metadata#Collection(com.sap.gateway.default.aif.messagehandling.v0001.MessageReturn)",
								"@odata.metadataEtag": "W/\"20200114140958\"",
								value: oMockData
							}));
						}.bind(oMockServer)
					});
					// compose an error response for a request
					var fnResponse2 = function (iErrCode, sMessage, aRequest) {
						aNewRequest.response = function (oXhr) {
							oXhr.respond(iErrCode, {
								"Content-Type": "text/plain;charset=utf-8"
							}, sMessage);
						};
					};

					// simulate metadata errors
					if (oOptions.metadataError || oUriParameters.get("metadataError")) {
						aNewRequest.forEach(function (aEntry) {
							if (aEntry.path.toString().indexOf("$metadata") > -1) {
								fnResponse2(500, "metadata Error", aEntry);
							}
						});
					}
					// simulate request errors
					var sErrorParam2 = oOptions.errorType || oUriParameters.get("errorType"),
						iErrorCode2 = sErrorParam2 === "badRequest" ? 400 : 500;
					if (sErrorParam2) {
						aNewRequest.forEach(function (aEntry) {
							fnResponse2(iErrorCode2, sErrorParam2, aEntry);
						});
					}

					//comments
					aNewRequest2.push({
						method: "GET",
						path: new RegExp("MessageComment.*"),
						response: function (xhr) {
							var sEntitySetName = "MessageComment";
							var oMockData = this._oMockdata[sEntitySetName];
							var mHeaders = {
								"Content-Type": "application/json;charset=utf-8"
							};
							xhr.respond(200, mHeaders, JSON.stringify({
								value: oMockData
							}));
						}.bind(oMockServer2)
					});
					// compose an error response for a request
					var fnResponse3 = function (iErrCode, sMessage, aRequest) {
						aNewRequest2.response = function (oXhr) {
							oXhr.respond(iErrCode, {
								"Content-Type": "text/plain;charset=utf-8"
							}, sMessage);
						};
					};

					// simulate metadata errors
					if (oOptions.metadataError || oUriParameters.get("metadataError")) {
						aNewRequest2.forEach(function (aEntry) {
							if (aEntry.path.toString().indexOf("$metadata") > -1) {
								fnResponse3(500, "metadata Error", aEntry);
							}
						});
					}
					// simulate request errors
					var sErrorParam3 = oOptions.errorType || oUriParameters.get("errorType"),
						iErrorCode3 = sErrorParam2 === "badRequest" ? 400 : 500;
					if (sErrorParam3) {
						aNewRequest2.forEach(function (aEntry) {
							fnResponse3(iErrorCode3, sErrorParam3, aEntry);
						});
					}
					// set requests and start the server
					oMockServer2.setRequests(aNewRequest2);
					oMockServer2.start();
					//end comments
					// set requests and start the server
					oMockServer.setRequests(aNewRequest);
					oMockServer.start();

					Log.info("Running the app with mock data");
					fnResolve();
				});

				oManifestModel.attachRequestFailed(function () {
					var sError = "Failed to load application manifest";
					Log.error(sError);
					fnReject(new Error(sError));
				});
			});
		},

		/**
		 * @public returns the mockserver of the app, should be used in integration tests
		 * @returns {sap.ui.core.util.MockServer} the mockserver instance
		 */
		getMockServer: function () {
			return oMockServer;

		}

	};

	return oMockServerInterface;
});