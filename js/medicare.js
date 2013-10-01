/**
 * Created by ewkoenw on 9/30/13.
 */
function MedicareRepository(DataService, $q, $rootScope) {
    var medicares = [];

    var getAll = function() {
        var delay = $q.defer();
        var errorHandler = function(error) {
            delay.reject('Error retrieving medicare records. Error was ' + error.message + ' (Code ' + error.code + ')');
            return false;
        };
        var successHandler = function (result) {
            var records = [];
            for (var i = 0; i < result.length; i++) {
                records.push(result[i]);
            }

            medicares = angular.copy(records);
            delay.resolve(records);
            $rootScope.$apply();
        };

        DataService.medicareDB.getAll(successHandler, errorHandler);

        return delay.promise;
    };

    var saveAll = function(updatedRecords) {
        var recordsToSave = updatedRecords;
        var ids = [];

        var errorOccurred = false;

        var errorHandler = function(error) {
            alert('Error saving medicare records. Error was ' + error.message + ' (Code ' + error.code + ')');
            errorOccurred = true;
            return false;
        };

        for (var i = 0; i < recordsToSave.length; i++) {
            var recordToSave = recordsToSave[i];
            ids.push(recordToSave.id);
            DataService.medicareDB.put(recordToSave, function(id) { console.log("ID: " + id) }, errorHandler);
        };

        angular.forEach(medicares, function(medicare, index) {
            if (ids.indexOf(medicare.id) < 0) {
                DataService.medicareDB.remove(medicare.id, function() {}, errorHandler);
            }
        });

        medicares = angular.copy(updatedRecords);
    };

    return {
        saveAll: saveAll,
        getAll: getAll
    }
};

function MedicareController($scope, dialog, MedicareRepository) {
    $scope.records = [];

    $scope.gridOptions = {
        data: 'records',
        enableCellEditOnFocus: true,
        enableCellSelection: true,
        enableRowSelection: false,
        enableSorting: false,
        columnDefs: [
            {field:'from', displayName:'From', cellFilter: 'currency' },
            {field:'employer', displayName:'Employer', cellFilter: 'currency'},
            {field:'employee', displayName:'Employee', cellFilter: 'currency'}
        ]
    };

    MedicareRepository.getAll()
        .then(function(result){
            $scope.records = result;
        }, function() { alert("Error loading Medicare data.")});

    $scope.determineNextId = function () {
        var max = 0;

        for (var i = 0; i < $scope.records.length; i++)
        {
            if (max < $scope.records[i].id)
            {
                max = $scope.records[i].id;
            }
        }

        return 1 + max;
    };

    $scope.addRow = function() {
        var newrecord = {};
        newrecord.id = $scope.determineNextId();

        $scope.records.push(newrecord);
    };

    $scope.deleteRow = function() {
        var rows = $scope.records.length;
        if (rows > 0) {
            $scope.records.splice(rows - 1, 1);
        }
    };

    $scope.save = function() {
        MedicareRepository.saveAll($scope.records);
        dialog.close();
    };

    $scope.cancel = function () {
        dialog.close();
    };

};