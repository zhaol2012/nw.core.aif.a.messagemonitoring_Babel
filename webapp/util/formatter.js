sap.ui.define([
	"sap/ui/core/format/DateFormat",
	"sap/ui/model/odata/v4/ODataUtils",
	"sap/base/security/encodeURL",
	"sap/ui/model/odata/type/DateTimeOffset"
], function (DateFormat, ODataUtils, encodeURL, DateTimeOffset) {
	"use strict";
	return {
		getFormatedDate: function (oDate, bUTC) {
			var oDateFormat = DateFormat.getDateTimeInstance({
				style: "medium",
				UTC: bUTC
			});
			return oDateFormat.format(oDate);
		},
		getConvertedDate: function (sDate) {
			var oDateFormat = DateFormat.getDateTimeInstance({
				style: "medium"
					// ,UTC: true
			});
			return oDateFormat.parse(sDate);
		},
		getEDMDate: function (oDate) {
			if (oDate) {
				var sMonth = "" + (oDate.getMonth() + 1);
				if (sMonth.length === 1) {
					sMonth = "0" + sMonth;
				}
				var sDate = "" + oDate.getDate();
				if (sDate.length === 1) {
					sDate = "0" + sDate;
				}
				var sEDMDate = "" + oDate.getFullYear() + "-" + ("0" + (oDate.getMonth() + 1)).slice(-2) + "-" + ("0" + oDate.getDate()).slice(-2) +
					"T" + ("0" + oDate.getHours()).slice(-2) + ":" + ("0" + oDate.getMinutes()).slice(-2) + ":" + ("0" + oDate.getSeconds()).slice(-
						2) + "Z";
				return sEDMDate;
			} else {
				return "";
			}
		},
		parseEDMDate: function (sDate, bUTC) {
			if (sDate && sDate !== "") {
				var oDate = ODataUtils.parseDateTimeOffset(sDate);
				if (bUTC) {
					//remove time zone offset
					oDate = new Date(oDate - 0 + oDate.getTimezoneOffset() * 60000);
				}
				return oDate;
			} else {
				return undefined;
			}
		},
		getAbapDateTime: function (sDateTime) {
			var oDateFormat = DateFormat.getDateTimeInstance({
				style: "medium"
			});
			var oDate = oDateFormat.parse(sDateTime);
			var sAbapDateTime = "" + oDate.getFullYear()  + ("0" + (oDate.getMonth() + 1)).slice(-2)  + ("0" + oDate.getDate()).slice(-
					2)  +
				("0" + oDate.getHours()).slice(-2)  + ("0" + oDate.getMinutes()).slice(-2)  + ("0" + oDate.getSeconds()).slice(-
					2);
			return sAbapDateTime;
		},
		getAbapDate: function (sDate) {
			var oDateFormat = DateFormat.getDateInstance({
				style: "medium"
			});
			var oDate = oDateFormat.parse(sDate);
			var sAbapDate = "" + oDate.getFullYear() + "-" + ("0" + (oDate.getMonth() + 1)).slice(-2) + "-" + ("0" + oDate.getDate()).slice(-2);
			return sAbapDate;
		},
		getAbapTime: function (sTime) {
			var oDateFormat = DateFormat.getTimeInstance({
				style: "medium"
			});
			var oDate = oDateFormat.parse(sTime);
			var sAbapTime =
				("0" + oDate.getHours()).slice(-2) + ":" + ("0" + oDate.getMinutes()).slice(-2) + ":" + ("0" + oDate.getSeconds()).slice(-
					2);
			return sAbapTime;
		},
		getFieldLabel: function (sFieldLabel, sFieldName) {
			if (sFieldLabel.length === 0) {
				return sFieldName;
			} else {
				return sFieldLabel;
			}
		},
		getStatusText: function (sStatus, eStatus) {
			if (eStatus === "50") {
				return "Edited";
			} else {
				switch (sStatus) {
				case "E":
					return "Error";
				case "A":
					return "Error";
				case "W":
					return "Warning";
				case "S":
					return "Success";
				case "I":
					return "In Process";
				case "C":
					return "Canceled";
				default:
					return sStatus;
				}
			}
		},
		getStatusIcon: function (sStatus, eStatus) {
			if (eStatus === "50") {
				return "sap-icon://edit";
			} else {
				switch (sStatus) {
				case "E":
					return "sap-icon://message-error";
				case "A":
					return "sap-icon://message-error";
				case "W":
					return "sap-icon://message-warning";
				case "S":
					return "sap-icon://message-success";
				case "I":
					return "sap-icon://process";
				case "C":
					return "sap-icon://cancel";
				default:
					return sStatus;
				}
			}
		},
		getStatusState: function (sStatus, eStatus) {
			if (eStatus === "50") {
				return "Information";
			} else {
				switch (sStatus) {
				case "E":
					return "Error";
				case "A":
					return "Error";
				case "W":
					return "Warning";
				case "S":
					return "Success";
				case "I":
					return "None";
				case "C":
					return "None";
				default:
					return "None";
				}
			}
		},
		getMessageType: function (sMsgType) {
			switch (sMsgType) {
			case "E":
				return sap.ui.core.MessageType.Error;
			case "I":
				return sap.ui.core.MessageType.Information;
			case "S":
				return sap.ui.core.MessageType.Success;
			case "W":
				return sap.ui.core.MessageType.Warning;
			default:
				return sap.ui.core.MessageType.None;
			}
		},
		getAssignedProcessStatusText: function (sStatus) {
			var oBundle = this.getView().getModel("i18n").getResourceBundle();
			var sMsg;
			switch (sStatus) {
			case "I":
				sMsg = oBundle.getText("processStatusInProcess");
				return sMsg;
			case "C":
				sMsg = oBundle.getText("processStatusCompleted");
				return sMsg;
			case "B":
				sMsg = oBundle.getText("processStatusBlocked");
				return sMsg;
			default:
				return sStatus;
			}
		},
		getCommentText: function (vCount) {
			var oBundle = this.getView().getModel("i18n").getResourceBundle();
			var sMsg = oBundle.getText("cellComment", vCount);
			return sMsg;
		}
	};
});