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
        url: "https://api.weibo.com/2/short_url/shorten.json?source=2849184197&url_long="+url,
        dataType: "JSONP",
        success: function (response) {
          shorturl = response.data.urls[0].url_short;
          layer.open({
            type:1,
            title:"分享链接",
            shadeClose: true,
            content: '<div class="share-url"><p>分享链接：（点击进入）</p><a href="/share/' + id + '" target="_blank">/share/' + id + '</a><p>m3u8API调用:</p><a href="/api/m3u8/'+id+'" target="_blank">m3u8调用api</a><p>iframe调用:（双击框选复制）</p><input class="layui-input" value="<iframe height=498 width=510 src=' + url + ' frameborder=0 allowfullscreen></iframe>" disabled/><p>短网址：</p><a href="'+shorturl+'" target="_blank">' + shorturl + '</a></div>'
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
    $(".selectedchangecategory").click(function(e) {
      layer.open({
        type:1,
        title:"批量修改分类",
        area:['auto','300px'],
        shadeClose: true,
        content: $('.selectedcategory')
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
    $(".doselectaddcategory").click(function(e) {
      var ids = [];
      $('.movieselected:checked').each(function(){  
        ids.push($(this).val()); 
      });
      var category = $(".selectmoviecategory").val();
      $.ajax({
        type: "post",
        url: "/selectedcategory",
        data: {idarr: ids,category:category},
        traditional: true,
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
      elem: '#imagesupload'
      ,url: '/imagesupload'
      ,field: 'image'
      ,multiple: true
      ,done: function(res){
        if(res.code==0) {
          $('#imageslists').append('<div class="image-show"><img src="'+ res.image +'" class="layui-upload-img"><input type="hidden" name="images" value="'+res.imagepath+'"><input class="show" type="radio" name="poster" value="'+res.imagepath+'"> 封面</input></div>')
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
    upload.render({
      elem: ".uploadposter",
      url: "/upposter",
      field: "image",
      method: 'POST',
      done: function(res, index, upload) {
        if(res.code==0) {
          layer.msg("封面图上传成功");
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
    var color = $('.inputbackgroundcolor').val();
    colorpicker.render({
      elem: '#selectbackgroundcolor',
      color: color,
      done: function(color) {
        $('.inputbackgroundcolor').val(color);
      }
    });
    form.on('select(shaixuan)', function(data) {
      window.location = "/admin/movies?category=" + data.value;
    });
    var tongjisortquery = "";
    var sorttongji = $("#sorttongji").val();
    var tongjicounts = $("#tongjicounts").val();
    form.on('select(sorttongji)', function(data) {
      sorttongji = data.value;
    });
    form.on('select(tongjicounts)', function(data) {
      tongjicounts = data.value;
    });
    $("#submitsort").click(function(e) {
      tongjisortquery = "?sort="+sorttongji + "&counts="+tongjicounts;
      window.location = "/admin/tongji" + tongjisortquery;
    });
    form.on('select(counts)',function(data) {
      window.location = "/admin/movies?counts=" + data.value;
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
$(".postimages").click(function(e) {
  window.location = "/cms/postimages";
});
$(".postarticles").click(function(e) {
  window.location = "/cms/postarticles";
});
$(".listszhuanma").click(function(e) {
  $.ajax({
    type: "POST",
    url: "/listszhuanma",
    dataType: "JSON",
    success: function (response) {
      if(response.success ==1 ) {
        location.reload();
      }
    }
  });
});
$(".btn-edit-category").click(function(e) {
  var id = $(e.target).data('id');
  window.location = "/category/"+id+"/edit";
});
$(".editmovietitle").click(function(e) {
  var id = $(e.target).data("id");
  window.location = "/movie/" + id + "/edit";
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
$(".savecategory").click(function(e) {
  var category = $(".moviecategory");
  var categorys = [];
  category.each(function(index, element) {
    var id = $(element).data("id");
    var selected = $(element).val();
    categorys.push({
      id: id,
      category: selected
    });
  });
  $.ajax({
    type: "POST",
    url: "/movies/updatecategory",
    data: {
      "datas": JSON.stringify(categorys)
    },
    dataType: "JSON",
    traditional: true,
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
$(".btn-delete-image").click(function(e) {
  var id = $(e.target).data("id");
  $.ajax({
    type: "DELETE",
    url: "/delete/image?id=" + id,
    dataType: "JSON",
    success: function (response) {
      if(response.success == 1) {
        location.reload();
      }
    }
  });
});
$(".btn-delete-article").click(function(e) {
  var id = $(e.target).data("id");
  $.ajax({
    type: "DELETE",
    url: "/delete/article?id=" + id,
    dataType: "JSON",
    success: function (response) {
      if(response.success == 1) {
        location.reload();
      }
    }
  });
});
$(".btn-delete-user").click(function(e) {
  var id = $(e.target).data("id");
  $.ajax({
    type: "DELETE",
    url: "/delete/user?id="+id,
    dataType: "JSON",
    success: function (response) {
      if(response.success==1) {
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
  chunkSize: 2000000,
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