sap.ui.define([
	"sap/ui/base/Object",
], function (Object) {
	"use strict";
	return Object.extend("MassProcessCall", {
		hex16: function () {

			return Math.floor((1 + Math.random()) * 0x10000).toString(16).substr(1);
		},
		createFlag: function (prefix) {

			return prefix + this.hex16() + "-" + this.hex16() + "-" + this.hex16();
		},
		constructor: function (serviceUrl, boundary, changeSet) {
			this.serviceUrl = serviceUrl;
			this.boundary = boundary === undefined ? this.createFlag("batch_") : boundary;
			this.changeSet = changeSet === undefined ? this.createFlag("changeset_") : changeSet;
		},

		pack: function (data) {
			var body = [];

			var contentID = 1;
			$.each(data, function (i, d) {
				var t = d.type.toUpperCase(),
					noBody = ["GET", "DELETE"];

				body.push("--" + this.boundary);
				if (noBody.indexOf(t) < 0) {
					body.push("Content-type: multipart/mixed; boundary=" + this.changeSet, "\r\n");
					body.push("--" + this.changeSet);
					body.push("Content-Type: application/http", "Content-Transfer-Encoding: binary");
					body.push("Content-ID: " + contentID, "\r\n");
					contentID = contentID + 1;
				} else {
					body.push("Content-Type: application/http", "Content-Transfer-Encoding: binary", "\r\n");
				}
				body.push(t + " " + d.url + " HTTP/1.1");
				body.push("Accept:application/json;odata.metadata=minimal;IEEE754Compatible=true");
				body.push("Content-Type:application/json;charset=UTF-8;IEEE754Compatible=true", "\r\n");
				body.push(d.data ? JSON.stringify(d.data) : "\r\n");

				if (noBody.indexOf(t) < 0) {
					body.push("--" + this.changeSet + "--", "\r\n");
				}
			}.bind(this));
			body.push("--" + this.boundary + "--", "\r\n");
			return body.join("\r\n");
		},
		unpack: function (xhr, status, complete) {
			var lines = xhr.responseText.split("\r\n"),
				boundary = lines[0],
				data = [],
				d = null;

			$.each(lines, function (i, l) {
				if (l.length) {
					if (l.indexOf(boundary) == 0) {
						if (d) data.push(d);
						d = {};
					} else if (d) {
						if (!d.status) {
							d.status = parseInt((function (m) {
								return m || [0, 0];
							})(/HTTP\/1.1 ([0-9]+)/g.exec(l))[1], 10);
						} else if (!d.data) {
							try {
								d.data = JSON.parse(l);
							} catch (ex) {}
						}
					}
				}
			});

			complete.call(this, xhr, status, data);
		},
		ajaxFetchToken: function () {
			return $.ajax({
				context: this,
				type: "GET",
				url: this.serviceUrl,
				headers: {
					"X-CSRF-Token": "Fetch"
				},
				success: function (output, status, xhr) {
					this.token = xhr.getResponseHeader("x-csrf-token");
				},
				error: function (output) {}
			});
		},
		ajaxBatch: function (params) {
			return $.ajax({
				context: this,
				type: "POST",
				url: this.serviceUrl + "/$batch",
				headers: {
					"Accept": "multipart/mixed",
					"x-csrf-token": this.token,
					"MIME-Version": "1.0",
					"OData-MaxVersion": "4.0",
					"OData-Version": "4.0"
				},
				dataType: "json",
				data: this.pack(params.data),
				contentType: "multipart/mixed; boundary=\"" + this.boundary + "\"",
				complete: params.complete ?
					function (xnr, status) {
						this.unpack(xnr, status, params.complete);
					} : null
			});
		},
		callBatch: function (params) {
			$.when(this.ajaxFetchToken()).done(function (data, textStatus, jqXHR) {
				this.ajaxBatch(params);
			}.bind(this));
		}
	});
});