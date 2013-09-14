/**
 * Created with JetBrains WebStorm.
 * User: ewkoenw
 * Date: 9/5/13
 * Time: 8:13 AM
 * To change this template use File | Settings | File Templates.
 */
var GeneralSetupController = function($scope, dialog) {
    $scope.cancelSetup = function() {
        dialog.close();
    };
    $scope.saveSetup = function() {
        dialog.close();
    };
}
