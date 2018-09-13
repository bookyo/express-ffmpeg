layui.use(['jquery','form','colorpicker','element','layer','upload'], function(){
    var form = layui.form;
    var $ = layui.$;
    var element = layui.element;
    var layer = layui.layer;
    var upload = layui.upload;
    var colorpicker = layui.colorpicker;
    form.on('submit(loginform)', function(data){
        $("#login").submit();
        return false;
    });
    $(".geturl").click(function(e){
      var id = $(this).attr("id");
      var host = window.location.host;
      var schma = window.location.protocol;
      var url = schma +'//'+ host+'/share/'+id;
      var shorturl = ""
      $.ajax({
        type: "get",
        url: "http://api.weibo.com/2/short_url/shorten.json?source=2849184197&url_long="+url,
        dataType: "JSONP",
        success: function (response) {
          shorturl = response.data.urls[0].url_short;
          layer.open({
            type:1,
            title:"分享链接",
            shadeClose: true,
            content: '<div class="share-url"><p>分享链接：（点击进入）</p><a href="/share/' + id + '" target="_blank">/share/' + id + '</a><p>iframe调用:（双击框选复制）</p><input class="layui-input" value="<iframe height=498 width=510 src=' + url + ' frameborder=0 allowfullscreen></iframe>" disabled/><p>短网址：</p><a href="'+shorturl+'" target="_blank">' + shorturl + '</a></div>'
          })
        }
      });
    });
    $(".category").click(function(e) {
      var id = $(e.target).data("id");
      $('.addcategory').attr('data-id',id);
      layer.open({
        type:1,
        title:"设置或添加分类",
        area: ['auto', '300px'],
        shadeClose: true,
        content: $('.addcategory')
      })
    });
    $(".doaddcategory").click(function(e) {
      var id = $(this).parent().data("id");
      var selectcategory = $('.selectcategory').val();
      var inputcategory = $('.inputcategory').val();
      $.ajax({
        type: "post",
        url: "/addcategory",
        data: {selectcategory: selectcategory,inputcategory: inputcategory,id: id},
        dataType: "JSON",
        success: function (response) {
          if(response.success==1) {
            location.reload();
          }
        }
      });
    });
    $(".add-category-btn").click(function(e) {
      layer.open({
        type:1,
        title:"添加分类",
        shadeClose: true,
        content: $('.addcategory')
      })
    });
    upload.render({
      elem: '#upload-wm',
      url: '/upwm',
      field: "img",
      done: function(res, index, upload) {
        if(res.code == 0) {
          var file= res.img.split("/");
          var src = "/"+file[1]+"/"+file[2];
          $("#inputwm").val("./"+res.img);
          $(".watermark").attr("src", src);
        }
      }
    });
    upload.render({
      elem: '#upload-player-mark',
      url: '/upwm',
      field: "img",
      done: function(res, index, upload) {
        if(res.code == 0 ) {
          var file = res.img.split("/");
          var path = "/"+file[1]+"/"+file[2];
          $("#input-player-mark").val(path);
          $(".watermark").attr("src", path);
        }
      }
    });
    upload.render({
      elem:".zimu",
      url: "/upzimu",
      field: "zimu",
      accept: "file",
      exts: "srt",
      done: function(res, index, upload) {
        if(res.code==0){
          layer.msg("字幕文件上传成功");
        }
      }
    });
    upload.render({
      elem: ".uploadvtt",
      url: "/upvtt",
      field: "vtt",
      accept: "file",
      exts: "vtt",
      method: 'POST',
      done: function(res, index, upload) {
        if(res.code==0){
          layer.msg("vtt字幕文件上传成功");
        }
      }
    });
    var color = $('.inputcolor').val();
    colorpicker.render({
      elem: '#selectcolor',
      color: color,
      done: function(color) {
        $('.inputcolor').val(color);
      }
    });
    form.on('select(shaixuan)', function(data) {
      window.location = "/admin/movies?category=" + data.value;
    });
    form.on('select(sorttongji)', function(data) {
      window.location = "/admin/tongji?sort=" + data.value;
    });
});
$(".zhuanma").click(function(e){
  $.ajax({
    type: "POST",
    url: "/transcode",
    dataType: "JSON",
    success: function (response) {
      if(response.success==1){
        location.reload();
      }
    }
  });
});
$(".ruku").click(function(e) {
  $.ajax({
    type: "POST",
    url: "/ruku",
    dataType: "JSON",
    success: function (response) {
      if(response.success == 1) {
        location.reload();
      }
    }
  });
});
$(".btn-delete-category").click(function(e) {
  var id = $(e.target).data("id");
  $.ajax({
    type: "DELETE",
    url: "/delete/category?id="+id,
    dataType: "JSON",
    success: function (response) {
      if(response.success == 1) {
        location.reload();
      }
    }
  });
});
$(".btn-delete-movie").click(function(e){
  var target = $(e.target);
  var id = target.data("id");
  $.ajax({
    type: "DELETE",
    url: "/delete/movie?id="+id,
    dataType: "JSON",
    success: function (response) {
      if(response.success == 1) {
        location.reload();
      }
    }
  });
});
var row = "<div class='layui-input-block mb5'><input type='text' value='' name='domains' placeholder='输入分发域名需要前缀http://或者https://' style='display:inline-block;width:80%;' class='layui-input'><button style='float:right;' class='layui-btn delrow'>删除此行</button></div>";
$(".addrow").click( function(){
   $(".domains").append(row);
   return false;
});
$(".domains").on('click', '.delrow', function () {
    $(this).parent().remove();
    return false;
});
var previewNode = document.querySelector("#template");
previewNode.id = "";
var previewTemplate = previewNode.parentNode.innerHTML;
previewNode.parentNode.removeChild(previewNode);

var myDropzone = new Dropzone(document.body, {
  url: "/upload", // Set the url
  parallelUploads: 5,
  maxFilesize:4000,
  uploadMultiple:false,
  chunking:true,
  timeout:30000,
  chunkSize: 1000000,
  parallelChunkUploads:false,
  retryChunks:true,
  chunksUploaded: function(file, done) {
    $(".filedone").html(file.name+"上传完成");
  },
  paramName: "file",
  previewTemplate: previewTemplate,
  autoQueue: false, // Make sure the files aren't queued until manually added
  previewsContainer: "#previews", // Define the container to display the previews
  clickable: ".fileinput-button"// Define the element that should be used as click trigger to select files.
});
myDropzone.on("uploadprogress", function (file, progress, bytesSent) {
  progress = bytesSent / file.size * 100;
  file.previewTemplate.querySelector(".layui-progress-bar").style.width = progress+"%";
});
myDropzone.on("error", function (file, errorMessage) {
  console.log(errorMessage);
  console.log(file);
});
// Setup the buttons for all transfers
// The "add files" button doesn't need to be setup because the config
// `clickable` has already been specified.
document.querySelector("#actions .start").onclick = function() {
  myDropzone.enqueueFiles(myDropzone.getFilesWithStatus(Dropzone.ADDED));
};
document.querySelector("#actions .cancel").onclick = function() {
  myDropzone.removeAllFiles(true);
  $(".filedone").html("");
};