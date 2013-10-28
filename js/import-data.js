/**
 * Created by ewkoenw on 10/26/13.
 */
function ImportController($scope, $rootScope, dialog) {
    $scope.file;

    $scope.import = function () {
        var reader = new FileReader();
        reader.onloadend = function(e) {
            $rootScope.$broadcast(PayrollConstants.importEvent, JSON.parse(this.result));
        };
        reader.readAsText($scope.file);

        dialog.close();
    };

    $scope.cancel = function() {
        dialog.close();
    };

    $scope.filenameChanged = function(selector) {
        if (selector.files && selector.files.length > 0) {
            $scope.file = selector.files[0];
            if (!$scope.$$phase) { $scope.$digest(); }
        }
    };
}
