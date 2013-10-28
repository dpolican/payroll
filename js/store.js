/**
 * Created with JetBrains WebStorm.
 * User: ewkoenw
 * Date: 9/21/13
 * Time: 5:34 PM
 * To change this template use File | Settings | File Templates.
 */
function StoreController($scope, dialog, StoreRepository) {
    $scope.stores = [];

    StoreRepository.getStores()
        .then(function(result){
            $scope.stores = result;
        }, function() { alert("Error loading Stores data.")});


    $scope.cancel = function() {
        dialog.close();
    };
    $scope.save = function() {
        StoreRepository.saveStores($scope.stores);
        dialog.close();
    };

    $scope.addStore = function() {
        $scope.stores.push({});
    };

    $scope.deleteStore = function() {
        var rows = $scope.stores.length;
        if (rows > 0) {
            $scope.stores.splice(rows - 1, 1);
        }
    }

};

function StoreRepository(DataService, $q, $rootScope) {
    var stores = [];

    var getStores = function() {
        var delay = $q.defer();
        var errorHandler = function(error) {
            delay.reject('Error retrieving social security records Error was ' + error.message + ' (Code ' + error.code + ')');
            return false;
        };
        var successHandler = function (result) {
            var records = [];
            for (var i = 0; i < result.length; i++) {
                records.push(result[i]);
            }

            stores = angular.copy(records);
            delay.resolve(records);
            $rootScope.$apply();
        };

        DataService.storeDB.getAll(successHandler, errorHandler);

        return delay.promise;
    };

    var saveStores = function(updatedRecords) {
        var recordsToSave = updatedRecords;
        var ids = [];

        var errorOccurred = false;

        var errorHandler = function(error) {
            alert('Error saving store records. Error was ' + error.message + ' (Code ' + error.code + ')');
            errorOccurred = true;
            return false;
        };

        for (var i = 0; i < recordsToSave.length; i++) {
            var recordToSave = recordsToSave[i];
            if (recordToSave.id) { ids.push(recordToSave.id); }
            DataService.storeDB.put(recordToSave, function(id) { console.log("ID: " + id) }, errorHandler);
        };

        angular.forEach(stores, function(store, index) {
            if (ids.indexOf(store.id) < 0) {
                DataService.storeDB.remove(store.id, function() {}, errorHandler);
            }
        });

        stores = angular.copy(updatedRecords);
    };

    return {
        saveStores: saveStores,
        getStores: getStores
    }
}
