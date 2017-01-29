var it = {};
var config = {
    apiKey: "AIzaSyDYNUKGh6DX4UjJbFgvY3wYhn4CP3fvQCM",
    authDomain: "kainoasgrill-14d8f.firebaseapp.com",
    databaseURL: "https://kainoasgrill-14d8f.firebaseio.com",
    storageBucket: "kainoasgrill-14d8f.appspot.com",
    messagingSenderId: "308354130455"
};
firebase.initializeApp(config);

var app = angular.module('MainApp', ['ngAnimate','ngResource','ngMaterial','firebase']);
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

app.controller('MainCtrl', function($scope, $http, $firebaseArray, $firebaseObject, Auth){
	Auth().then(function(user){
		it.user = user;
	})
	var tools = $scope.tools = {
		user: Auth,
		init: function(){
			
		}
	}
	tools.init();
	it.MainCtrl = $scope;
})