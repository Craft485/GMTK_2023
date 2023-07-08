const path = require('path')

module.exports = {
	entry: './src/index.ts',
	mode: "development",
	module: {
    	rules: [
    	    {
    	        test: /\.tsx?$/,
    	        use: 'ts-loader',
    	        exclude: /node_modules/
    	    },
			{
				test: /\.json$/,
				type: 'json'
			}
    	]
  	},
  	resolve: {
  		extensions: ['.tsx', '.ts', '.js', '.css']
  	},
  	output: {
		filename: 'bundle.js',
		path: path.resolve(__dirname, 'dist')
	}
}