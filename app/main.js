var it = {};
var config = {
    apiKey: "AIzaSyDYNUKGh6DX4UjJbFgvY3wYhn4CP3fvQCM",
    authDomain: "kainoasgrill-14d8f.firebaseapp.com",
    databaseURL: "https://kainoasgrill-14d8f.firebaseio.com",
    storageBucket: "kainoasgrill-14d8f.appspot.com",
    messagingSenderId: "308354130455"
};
firebase.initializeApp(config);

var app = angular.module('MainApp', ['ngAnimate','ngRoute','ngResource','ngMaterial','firebase']);
app.config(function($routeProvider,$locationProvider){
	$locationProvider
		.html5Mode(false)
		.hashPrefix('');
	$routeProvider
	.when('/:view', {
		templateUrl: function($routeParams){
			return 'views/'+$routeParams.view+'.html'
		},
	})
	.when('/:view/:id', {
		templateUrl: function($routeParams){
			return 'views/'+$routeParams.view+'.html'
		},
	})
	.otherwise({
		redirectTo: '/main'
	});
})

app.factory('Auth', function ($rootScope, $q, $firebaseAuth, $firebaseObject) {
	var signin = $q.defer();
	$firebaseAuth().$onAuthStateChanged(function(user){
		if(user){
			
			var actRef = firebase.database().ref().child('site/private/accounts').child(user.uid);
				actRef.set(user.toJSON())
			
			var roleRef = firebase.database().ref().child('site/public/roles').child(user.uid);
			var roleObj = $firebaseObject(roleRef);
			roleObj.$loaded().then(function(){
				user.roles = roleObj || {};
				user.is = function(role){
					return !!user.roles[role]
				}
				user.jwt = function(){
					return firebase.auth().currentUser.getToken(true)
				}
				$rootScope.user = user;
				signin.resolve(user)
			});
		}
	})
	function userAuth(){
		return signin.promise;
	}
	userAuth.login =  function(type){
		type = type || 'google';
		$firebaseAuth().$signInWithPopup(type);
	}
	return userAuth;
})

app.directive('clSrc', function($timeout) {
	return {
		restrict: 'A',
		scope: { clSrc: '@'},
		link: function(scope, ele, attrs) {
			scope.attrs = attrs;
			it.clAttrs = attrs;
			console.log('update')
			var tsrc, src;
			function transform(attrs){
				var clKeys = Object.keys(attrs)
				clKeys = clKeys.filter(function(key){
					return key.indexOf('transform') == 0
				})
				var transform = ''
				clKeys.forEach(function(key, i){
					var val = attrs[key];
					transform += key.replace('transform','').toLowerCase() + '_' + val
					if(i != clKeys.length - 1)
						transform += ','
				})
				if(clKeys.length && !attrs['transformC'])
					transform += ',c_fill'
				if(attrs['auto']){
					if(clKeys.length)
						transform += ','
					transform += 'g_auto,q_auto,f_auto'
				}
				return transform;
			}
			scope.$watch('clSrc', function(val) {
				if(val){
					tsrc = val.split('upload')
					src = tsrc[0]+'upload/'+transform(attrs)+tsrc[1]
					$(ele).attr("src", src);
				}
			})
			scope.$watch('attrs', function(newVal, oldVal) {
				console.log('changed');
				if(tsrc){
					src = tsrc[0]+'upload/'+transform(newVal)+tsrc[1]
					$(ele).attr("src", src);
				}
			}, true);
		}
	};
});
app.directive("contenteditable", function() {
	return {
		restrict: "A",
		require: "ngModel",
		link: function(scope, element, attrs, ngModel) {
			it.a = attrs;
			var read;
			if(!ngModel)
				return;
			
			ngModel.$render = function() {
				return element.text(ngModel.$viewValue || attrs.placeholder);
			};
			element.bind('blur', function() {
				if (ngModel.$viewValue !== $.trim(element.text())) {
					return scope.$apply(read);
				}
			});
			return read = function() {
				var newVal = $.trim(element.text())
				if(!newVal && attrs.placeholder){
					newVal = attrs.placeholder;
					element.text(newVal);
				}
				return ngModel.$setViewValue(newVal);
			};
		}
	};
});


app.controller('MainCtrl', function($scope, $http, $q, $routeParams, $firebaseArray, $firebaseObject, $mdDialog, Auth){
	console.log('mainCtrl')
	$scope.rp = $routeParams;
	Auth().then(function(user){
		it.user = user;
	})
	var tools = $scope.tools = {
		user: Auth,
		init: function(){
			$scope.view = $routeParams.view;
			$scope.data = {};
			var catRef = firebase.database().ref('site/public/menu/categories')
			var categories = $scope.data.categories = $firebaseArray(catRef)
			var prodRef = firebase.database().ref('site/public/menu/products')
			var products = $scope.data.products = $firebaseArray(prodRef)
		},
		view: function(view){
			if($routeParams.view)
				return 'views/'+$routeParams.view+'.html';
		},
		category: {
			focus: function(event, category){
				$scope.category = category;
				$scope.products = $scope.data.products.filter(function(p){
					if(p.categories)
						return p.categories.indexOf(category.name) != -1;
				})
				$mdDialog.show({
					templateUrl: 'partials/catDialog.html',
					scope: $scope,
					preserveScope: true,
					targetEvent: event,
					clickOutsideToClose: true,
					fullscreen: $scope.customFullscreen // Only for -xs, -sm breakpoints.
				})
			},
			products: function(category){
				return $scope.data.products.filter(function(p){
					if(p.categories)
						return p.categories.indexOf(category.name) != -1;
				})
			},
			setImg: function(category, url){
				category.img = url;
				$scope.data.categories.$save(category).then(function(r){
					alert(r)
				})
			}
		},
		migrate:{
			img: function(item){
				$.post('https://the.atfiliate.com/cloud/imgConvert', {url:item.picture.src}).done(function(result){
					item.image = result;
					$scope.data.products.$save(item)
				})
			}
		}
	}
	tools.init();
	it.MainCtrl = $scope;
})