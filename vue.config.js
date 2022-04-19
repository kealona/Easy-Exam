const webpack = require('webpack')

module.exports = {
	css: {
		loaderOptions: {
			sass: {
				data: `
						@import "~@/sass/global.scss";
						@import "~@/sass/mixins.scss";
				`
			}
		}
	},
	publicPath: './',
	productionSourceMap: false,
	pluginOptions: {
		electronBuilder: {
			builderOptions: {
				asar: true,
				/* nodeIntegration: true, */
				asarUnpack: ['exeFiles'],
				extraResources: [{
					from: 'node_modules/ffmpeg-static-electron',
					to: './ffmpeg-static-electron'
				}],
				win: {
					"requestedExecutionLevel": 'requireAdministrator'
				}
			}
		}
	},
	configureWebpack: {
		target: 'node-webkit',
		plugins: [
			new webpack.EnvironmentPlugin({
				FLUENTFFMPEG_COV: false
			}),
			new webpack.ExternalsPlugin("commonjs", ["ffi-napi"])
		],
		externals: {
			'ffmpeg-static-electron': 'commonjs2 ffmpeg-static-electron'
		}
	},
}
