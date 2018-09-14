layui.use(['jquery', 'form', 'element', 'layer'], function () {
  var form = layui.form;
  var $ = layui.$;
  var element = layui.element;
  var layer = layui.layer;
  var flash = $(".flash");
  if(flash.length>0&&flash.html()!="") {
      layer.msg(flash.html());
  }
  form.verify({
      length: [
          /^[\S]{6,15}$/
          ,'账号或密码必须6到16位，且不能出现空格'
      ],
      card: [
          /^[\S]{20}$/
          ,'卡劵必须为20位非空字母和数字组合'
      ]
  });
});