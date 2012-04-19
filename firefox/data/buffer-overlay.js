var bufferOverlay = function(data, config, doneCallback) {
    
    if( ! doneCallback ) doneCallback = function () {};
    if( ! config ) return;
    
    var buildSrc = function() {
        var src = config.overlay.endpoint;
        if( data.local ) src = config.overlay.localendpoint;
        
        // Add button attributes
        var first = true, count = 0;
        for(var i=0, l=config.attributes.length; i < l; i++) {
            var a = config.attributes[i];
            if( ! data[a.name] ) continue;
            if( first ) { src += '?'; first = false; }
            count += 1;
            if( count > 1 ) src += '&';
            src += a.name + '=' + a.encode(data[a.name])
        }
        
        return src;
    };
    
    var temp = document.createElement('iframe');
    
    temp.allowtransparency = 'true';
	temp.scrolling = 'no';
	temp.id = 'buffer_overlay';
	temp.name = 'buffer_overlay';
	temp.style.cssText = config.overlay.getCSS();
	
	temp.src = buildSrc();
	
	document.body.appendChild(temp);
    
    // Bind close listener
	bufferpm.bind("buffermessage", function(data) {
		document.body.removeChild(temp);
		bufferpm.unbind("buffermessage");
		setTimeout(function () {
		    doneCallback(data);
	    }, 0);
	});
    
};

var bufferData = function () {
    
    var config = {};
    config.local = false;
    config.attributes = [
        {
            name: "url",
            get: function (cb) {
                cb(window.location.href);
            },
            encode: function (val) {
                return encodeURIComponent(val);
            }
        },
        {
            name: "text",
            get: function (cb) {
                if(document.getSelection() != false) cb('"' + document.getSelection().toString() + '"');
                else cb(document.title);
            },
            encode: function (val) {
                return encodeURIComponent(val);
            }
        },
        {
            name: "picture",
            get: function (cb) {
                self.port.on("buffer_image", function(data) {
                    cb(data);
                });
                self.port.emit("buffer_get_image");
            },
            encode: function (val) {
                return encodeURIComponent(val);
            }
        },
        {
            name: "tweet",
            get: function (cb) {
                self.port.on("buffer_tweet", function(data) {
                    cb(data);
                });
                self.port.emit("buffer_get_tweet");
            },
            encode: function (val) {
                return encodeURIComponent(val);
            }
        },
        {
            name: "local",
            get: function (cb) {
                cb(config.local);  
            },
            encode: function (val) {
                return encodeURIComponent(val);
            }
        }
    ];
    config.overlay = {
        endpoint: (config.local ? 'http:' : document.location.protocol) + '//bufferapp.com/add/',
        localendpoint: (config.local ? 'http:' : document.location.protocol) + '//local.bufferapp.com/add/',
        getCSS: function () { return "border:none;height:100%;width:100%;position:fixed;z-index:99999999;top:0;left:0;"; }
    };

    var executeAfter = function(done, count, data, cb) {
        if(done === count) {
            setTimeout(function(){
                cb(data)
            }, 0);
        }
    };

    var getData = function (cb) {
        var count = config.attributes.length;
        var done = 0;
        var data = {};
        for(var i=0; i < count; i++) {
            // Wrapped in a self-executing function to ensure we don't overwrite ‘a’
            // and that the correct ‘i’ is used
            (function (i) {
                var a = config.attributes[i];
                a.get(function(d) {
                    done += 1;
                    data[a.name] = d;
                    executeAfter(done, count, data, cb);
                });
            }(i));
        }
    };

    var createOverlay = function (data) {
        if( data.tweet ) {
            data.text = data.tweet;
            data.tweet = null;
            data.url = null;
        }
        var count = config.attributes.length;
        for(var i=0; i < count; i++) {
            var a = config.attributes[i];
            //console.log(a.name, " : ", data[a.name]);
        }
        bufferOverlay(data, config, function () {
            self.port.emit("buffer_done");
        });
    };

    getData(createOverlay);
    
};

