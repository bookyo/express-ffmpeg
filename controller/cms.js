var Movie = require('../models/movie');
var Category = require('../models/category');
var Portal = require('../models/portal');
exports.index = function(req, res) {
    var page = req.query.page > 0 ? req.query.page : 1;
    var perPage = 12;
    Portal.find()
        .exec(function(err, portals) {
            if(err) {
                console.log(err);
            }
            if(portals[0].kaiguan == "on") {
                Category.find()
                    .exec(function(err, categories) {
                        if(err) {
                            console.log(err);
                        }
                        Movie.find({status: 'finished'})
                            .sort('-createAt')
                            .limit(perPage)
                            .skip(perPage * (page-1))
                            .exec(function(err, movies) {
                                if(err) {
                                    console.log(err);
                                }
                                Movie.find({status: 'finished'}).count(function (err, count) {
                                    var length = movies.length;
                                    var jiange = parseInt(perPage / 3);
                                    var results = [];
                                    for(var i=0;i<length;i=i+jiange) {
                                        results.push(movies.slice(i,i+jiange));
                                    }
                                    res.render('index',{
                                        categories: categories,
                                        movies: results,
                                        page: page,
                                        pages: Math.ceil(count / perPage),
                                        portal: portals[0]
                                    })
                                })
                            
                            })
                    })
            } else {
                res.status(404).send('对不起，页面不存在');
            }
        })
}

exports.getmovie = function(req, res) {
    var id = req.params.id;
    Movie.findOne({_id: id})
        .exec(function(err, movie) {
            if(err) {
                console.log(err);
            }
            if(!movie){
                return res.status(404).send('视频不存在');
            }
            Category.find()
                .exec(function(err, categories) {
                    if(err) {
                        console.log(err);
                    }
                    res.render('cmsmovie', {
                        portal: req.portal,
                        movie: movie,
                        categories: categories
                    })
                })
        })
}

exports.getcategory = function(req, res) {
    var category = req.params.category;
    var page = req.query.page > 0 ? req.query.page : 1;
    var perPage = 12;
    Category.find()
        .exec(function(err, categories) {
            if(err) {
                console.log(err);
            }
            Movie.find({status: 'finished'})
                .where({category: category})
                .sort('-createAt')
                .limit(perPage)
                .skip(perPage * (page-1))
                .exec(function(err, movies) {
                    if(err) {
                        console.log(err);
                    }
                    if(movies.length==0) {
                        return res.status(404).send('该分类无内容');
                    }
                    Movie.find({status: 'finished',category: category}).count(function (err, count) {
                        var length = movies.length;
                        var jiange = parseInt(perPage / 3);
                        var results = [];
                        for(var i=0;i<length;i=i+jiange) {
                            results.push(movies.slice(i,i+jiange));
                        }
                        res.render('index',{
                            categories: categories,
                            movies: results,
                            page: page,
                            currentcategory: category,
                            pages: Math.ceil(count / perPage),
                            portal: req.portal
                        })
                    })
                
                })
        })
}