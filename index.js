var request = require('request');
var cheerio = require('cheerio');
var S = require('string');

var urlRoot = "https://www.eztv.ag/";

var self = module.exports;

self.getShows = function(options, callback) {

	request(urlRoot + "showlist/", function (error, response, body) {

		if (!error && response.statusCode == 200) {

			var list = [];
			var $ = cheerio.load(body);
			var $elements = $("table.forum_header_border tr[name=hover]");
			$elements.each(function(i, e) {

				var show = {};
				show.url = $(e).find("td .thread_link").attr("href");
				if (!show.url) {
					return;
				}
				var regex = show.url.match(/\/shows\/(\d+)\/([^\/]+)/);
				if (!regex) {
					return;
				}
				show.id = parseInt(regex[1]);
				show.slug = regex[2];

				var title = $(e).find("td .thread_link").text();
				if (S(title).endsWith(", The")) {
					title = "The " + S(title).chompRight(", The").s;
				}
				show.title = title;
				show.status = $(e).find("td font").attr("class");

				if (options && options.query) {
					if (show.title.toLowerCase().search(options.query.toLowerCase()) >= 0) {
						list.push(show);
					}
				}
				else {
					list.push(show);
				}

			});
			if (callback) callback(null, list);
		} else {
			console.log("Error getting shows", error, response);
			if (callback) callback(new Error("Error getting shows"), null);
		}
	});
};

self.getShowEpisodes = function(showId, callback) {

	request(urlRoot + "shows/" + showId + "/", function (error, response, body) {

		if (!error && response.statusCode == 200) {

			var result = {
				id: showId,
				episodes: []
			};

			var $ = cheerio.load(body);
			result.title = $("td.section_post_header h2").text();

			var $episodes = $("table.forum_header_noborder tr[name=hover]");
			$episodes.each(function(i, e) {

				var episode = {};

				episode.url = $(e).find("td a").attr("href");
				if (!episode.url) return;
				var urlRegex = episode.url.match(/\/episodes\/(\d+)\/.*/);
				if (!urlRegex) {
					urlRegex = episode.url.match(/\/ep\/(\d+)\/.*/);
				}
				episode.id = parseInt(urlRegex[1]);

				episode.title = $(e).find("td a").text();
				var titleRegex = episode.title.match(/(.+) s?(\d+)[ex](\d+)(e(\d+))?(.*)/i);
				if (titleRegex) {
					episode.show = titleRegex[1];
					episode.seasonNumber = parseInt(titleRegex[2]);
					episode.episodeNumber = parseInt(titleRegex[3]);
					episode.episodeNumber2 = parseInt(titleRegex[5]);
					episode.extra = titleRegex[6].trim();
					episode.proper = episode.extra.toLowerCase().indexOf("proper") >= 0;
					episode.repack = episode.extra.toLowerCase().indexOf("repack") >= 0;
				}

				episode.magnet = $(e).find("td a.magnet").attr("href");
				episode.torrentURL = $(e).find("td a.download_1").attr("href");

				result.episodes.push(episode);
			});
			if (callback) callback(null, result);
		} else {
			if (callback) callback(new Error("Error getting show episodes"), null);
		}
	});
};
