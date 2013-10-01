/**
 * Created by ewkoenw on 9/29/13.
 */
function WithholdingTypesRepository(DataService, $q, $rootScope) {
    var withholdingTypes = [];

    var getAll = function() {
        var delay = $q.defer();
        var errorHandler = function(error) {
            delay.reject('Error retrieving withholding type records. Error was ' + error.message + ' (Code ' + error.code + ')');
            return false;
        };
        var successHandler = function (result) {
            var records = [];
            for (var i = 0; i < result.length; i++) {
                records.push(result[i]);
            }

            withholdingTypes = angular.copy(records);
            delay.resolve(records);
            $rootScope.$apply();
        };

        DataService.withholdingTypeDB.getAll(successHandler, errorHandler);

        return delay.promise;
    };

    var saveAll = function(updatedRecords) {
        var recordsToSave = updatedRecords;
        var ids = [];

        var errorOccurred = false;

        var errorHandler = function(error) {
            alert('Error saving withholding type records. Error was ' + error.message + ' (Code ' + error.code + ')');
            errorOccurred = true;
            return false;
        };

        for (var i = 0; i < recordsToSave.length; i++) {
            var recordToSave = recordsToSave[i];
            ids.push(recordToSave.id);
            DataService.withholdingTypeDB.put(recordToSave, function(id) { console.log("ID: " + id) }, errorHandler);
        };

        angular.forEach(withholdingTypes, function(withholdingType, index) {
            if (ids.indexOf(withholdingType.id) < 0) {
                DataService.withholdingTypeDB.remove(withholdingType.id, function() {}, errorHandler);
            }
        });

        withholdingTypes = angular.copy(updatedRecords);
    };


    return {
        saveAll: saveAll,
        getAll: getAll
    }
};

function WithholdingTypesController($scope, dialog, WithholdingTypesRepository) {
    $scope.records = [];

    $scope.gridOptions = {
        data: 'records',
        enableCellEditOnFocus: true,
        enableCellSelection: true,
        enableRowSelection: false,
        enableSorting: false,
        columnDefs: [
            {field:'type', displayName:'Type', width: 68 },
            {field:'description', displayName:'Description'}
        ]
    };



    WithholdingTypesRepository.getAll()
        .then(function(result){
            $scope.records = result;
        }, function() { alert("Error loading Withholding Types data.")});

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
        WithholdingTypesRepository.saveAll($scope.records);
        dialog.close();
    };

    $scope.cancel = function () {
        dialog.close();
    };


}

