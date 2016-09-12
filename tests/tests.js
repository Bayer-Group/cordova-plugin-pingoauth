exports.defineAutotests = function () {

    describe('cordova-plugin-pingauth', function () {

        var _authentication;

        beforeEach(function () {
            handlers = {
                successHandler: function () { },
                errorHandler: function () { }
            };
        });

        beforeEach(function () { _authentication = new cordova.plugins.Authentication(); });

        it('should be defined', function () {
            expect(cordova.plugins.pingoauth).toBeDefined();
        });

        it('should be able to do an login and get the token',function(){
        spyOn(handlers, 'successHandler').and.callFake(function (res) {
             
        });
        spyOn(handlers, 'errorHandler');
        
         _authentication.Login('username', 'password', handlers.successHandler, handlers.errorHandler, false)
        })

        it ('should be able to do the oauth login', function () {
        spyOn(handlers, 'successHandler').and.callFake(function (res) {

        });
        spyOn(handlers, 'errorHandler');  
        })


    })
}