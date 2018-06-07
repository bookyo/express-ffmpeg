layui.use(['jquery','form','element','layer','upload'], function(){
    var form = layui.form;
    var $ = layui.$;
    var element = layui.element;
    var layer = layui.layer;
    var upload = layui.upload;
    form.on('submit(loginform)', function(data){
        $("#login").submit();
        return false;
    });
    $(".geturl").click(function(e){
      var id = $(this).attr("id");
      layer.open({
        type:1,
        title:"分享链接",
        shadeClose: true,
        content:'<div class="share-url"><p>分享链接：（点击进入）</p><a href="/share/'+id+'" target="_blank">/share/'+id+'</a></div>'
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
  chunkSize: 4000000,
  parallelChunkUploads:false,
  retryChunks:true,
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
// Setup the buttons for all transfers
// The "add files" button doesn't need to be setup because the config
// `clickable` has already been specified.
document.querySelector("#actions .start").onclick = function() {
  myDropzone.enqueueFiles(myDropzone.getFilesWithStatus(Dropzone.ADDED));
};
document.querySelector("#actions .cancel").onclick = function() {
  myDropzone.removeAllFiles(true);
};