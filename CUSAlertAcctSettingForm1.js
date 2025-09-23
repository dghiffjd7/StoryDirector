var CUSAlertAcctSettingForm1 = {
  doInitialize: function () {
    // 1. 將表單所有欄位設為唯讀
    var allFields = form.fields; // QS 表單欄位集合
    for (var i = 0; i < allFields.length; i++) {
      form.setFieldDisabled(allFields[i].name, true); // 設唯讀
    }

    // 2. 綁定「確定」按鈕事件
    var okButton = form.getControl('OkButton'); // 假設表單裡的確定按鈕名稱是 OkButton
    if (okButton) {
      okButton.onclick = function () {
        CUSAlertAcctSettingForm1.setCaseStateToWarn();
      };
    }
  },

  setCaseStateToWarn: function () {
    if (!clientData.entityId) {
      Jui.message.alert('沒有指定的資料，無法更新。');
      return;
    }

    var api = clientData.unitCode + '.Save.data';
    var args = {
      data: [
        {
          FId: clientData.entityId, // 當前 AlertAcctSetting 的 FId
          U_CaseState: 1, // 更新狀態為「警示」
        },
      ],
    };

    Jui.message.confirm('是否要將此帳號設為警示？', function (result) {
      if (result != 'ok') {
        return;
      }

      Utility.invoke(api, args, true, {
        onsuccess: function () {
          form.setFieldValue('U_CaseState', 1);
          if (EntityForm.clearModificationFlag) {
            EntityForm.clearModificationFlag();
          }
          EntityForm.reload(); // 重新整理表單
        },
      });
    });
  },
};
