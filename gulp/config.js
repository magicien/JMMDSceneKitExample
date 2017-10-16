const path = require('path');
const babel = require('babel-core/register');
const webpack = require('webpack');

const src = path.resolve(__dirname, '../src');
const dest = path.resolve(__dirname, '../public');

const relativeSrcPath = path.relative('.', src);

module.exports = {
  dest: dest,

  js: {
    src: src + '/js/**',
    dest: dest,
    uglify: false
  },

  eslint: {
    src: [
      src + '/**/*.js',
      './test/**/*.js',
    ],
    opts: {
      useEslintrc: true
    }
  },

  ex1: {
    copy: {
      src: [
        src + '/ex1/index.html',
        src + '/ex1/models.json',
        src + '/ex1/art.scnassets/**'
      ],
      dest: dest,
      opts: {
        base: src
      }
    },

    webpack: {
      context: src,
      target: 'web',
      entry: './ex1/js/main.js',
      output: {
        path: dest,
        filename: 'ex1/index.js',
        library: 'JMMDSceneKitExample',
        libraryTarget: 'var'
      },
      devServer: {
        contentBase: dest,
        port: 8080,
        staticOptions: {
          setHeaders: (res, path, stat) => {
            if(/\.exr$/.test(path)){
              res.setHeader('Content-Type', 'image/x-exr')
            }
          }
        }
      },
      resolve: {
        extensions: ['.js']
      },
      plugins: [
      ],
      module: {
        loaders: [
          {
            test: /\.js$/,
            exclude: /node_modules/,
            loader: 'babel-loader',
            query: {
              presets: ['env']
            }
          }
        ]
      },
      node: {
        Buffer: false
      },
      externals: {
        //fs: 'fs'
      }
    },
  },
  
  mocha: {
    src: ['test/**/*.js', 'src/**/*.js', '!test/helper/**'],
    compilers: {
      js: babel
    },
    opts: {
      ui: 'bdd',
      reporter: 'spec', // or nyan
      globals: [],
      require: ['test/helper/testHelper', 'chai']
    }
  },

  watch: {
    js: __dirname + '/../' + src + '/js/**'
  }
}

