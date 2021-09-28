// Created by Jonathan Eatherly, (https://github.com/joneath)
// MIT license
// Version 0.3

define(function() {
	'use strict';

	var InfiniScroll = function(collection, options) {
		options = options || { };

		var self = { },
			$target,
			fetchOn,
			page,
			pageSize,
			prevScrollY = 0;

		pageSize = options.collectionPageSize ? (options.collectionPageSize / 2) : (collection.length || 25);

		self.collection = collection;
		self.options = _.defaults(options, {
			success: function(){ },
			error: function(){ },
			onFetch: function(){ },
			fetchHasMoreResults: undefined,
			buildQueryParams: undefined,
			target: $(window),
			param: "until",
			extraParams: {},
			pageSizeParam: "page_size",
			untilAttr: "id",
			pageSize: pageSize,
			scrollOffset: 100,
			remove: false,
			strict: false,
			includePage: false
		});

		var initialize = function() {
			$target = $(self.options.target);
			fetchOn = true;
			page = self.options.collectionPageSize ? 2 : 1;

			$target.on("scroll", self.watchScroll);
		};

		self.destroy = function() {
			$target.off("scroll", self.watchScroll);
		};

		self.resetScroll = function() {
			fetchOn = true;
			page = self.options.collectionPageSize ? 2 : 1;
		};

		self.enableFetch = function() {
			fetchOn = true;
		};

		self.disableFetch = function() {
			fetchOn = false;
		};

		self.onFetch = function() {
			self.options.onFetch();
		};

		self.fetchHasMoreResults = function(collection, response) {
			if (self.options.fetchHasMoreResults && typeof(self.options.fetchHasMoreResults === 'function')) {
				return self.options.fetchHasMoreResults.call(self, collection, response);
			}
			else {
				return (self.options.strict && collection.length >= (page + 1) * self.options.pageSize) || (!self.options.strict && response.length > 0);
			}
		};

		self.fetchSuccess = function(collection, response) {
			if (self.fetchHasMoreResults(collection, response)) {
				self.enableFetch();
				page += 1;
			} else {
				self.disableFetch();
			}
			self.options.success(collection, response);
		};

		self.fetchError = function(collection, response) {
			self.enableFetch();

			self.options.error(collection, response);
		};

		self.watchScroll = function(e) {
			var queryParams,
				scrollY = $target.scrollTop() + $target.height(),
				docHeight = $target.get(0).scrollHeight;

			if (!docHeight) {
				docHeight = $(document).height();
			}

			if (scrollY >= docHeight - self.options.scrollOffset && fetchOn && prevScrollY <= scrollY) {
				var lastModel = self.collection.last();
				if (!lastModel) { return; }

				self.onFetch();
				self.disableFetch();
				self.collection.fetch({
					success: self.fetchSuccess,
					error: self.fetchError,
					remove: self.options.remove,
					data: $.extend(buildQueryParams(lastModel), self.options.extraParams)
				});
			}
			prevScrollY = scrollY;
		};

		function buildQueryParams(model) {
			var params = { };

			if (self.options.buildQueryParams && typeof(self.options.buildQueryParams === 'function')) {
				params = self.options.buildQueryParams.call(self, model, page);
			}
			else {
				params[self.options.param] = typeof(model[self.options.untilAttr]) === "function" ? model[self.options.untilAttr]() : model.get(self.options.untilAttr);
				params[self.options.pageSizeParam] = self.options.pageSize;

				if (self.options.includePage) {
					params["page"] = page + 1;
				}
			}

			return params;
		}

		initialize();

		return self;
	};
	return InfiniScroll;
});
