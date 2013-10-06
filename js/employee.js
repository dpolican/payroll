/**
 * Created by ewkoenw on 10/6/13.
 */
function EmployeeRepository(DataService, $q, $rootScope) {

    var getAll = function() {
        var delay = $q.defer();
        var errorHandler = function(error) {
            delay.reject('Error retrieving employee records. Error was ' + error.message + ' (Code ' + error.code + ')');
            return false;
        };
        var successHandler = function (result) {
            var records = [];
            for (var i = 0; i < result.length; i++) {
                records.push(result[i]);
            }

            employees = angular.copy(records);
            delay.resolve(records);
            $rootScope.$apply();
        };

        DataService.employeeDB.getAll(successHandler, errorHandler);

        return delay.promise;
    };

    var saveAll = function(updatedRecords) {
        var recordsToSave = updatedRecords;
        var ids = [];

        var errorOccurred = false;

        var errorHandler = function(error) {
            alert('Error saving employee records. Error was ' + error.message + ' (Code ' + error.code + ')');
            errorOccurred = true;
            return false;
        };

        for (var i = 0; i < recordsToSave.length; i++) {
            var recordToSave = recordsToSave[i];
            ids.push(recordToSave.id);
            DataService.employeeDB.put(recordToSave, function(id) { console.log("ID: " + id) }, errorHandler);
        };

        angular.forEach(employees, function(employee, index) {
            if (ids.indexOf(employee.id) < 0) {
                DataService.employeeDB.remove(employee.id, function() {}, errorHandler);
            }
        });

        employees = angular.copy(updatedRecords);
    };

    return {
        saveAll: saveAll,
        getAll: getAll
    }
};

function EmployeeController($scope, dialog, EmployeeRepository) {

    $scope.records = [{lastName:"Antaran", firstName:"Roy"},
        {lastName: "Bancale", firstName:"Jerry"},
        {lastName: "Bunzo", firstName:"Ernesto"},
        {lastName: "Cacalda", firstName:"Melchor"}];
    $scope.record = $scope.records[0];
/*
    EmployeeRepository.getAll()
        .then(function(result){
            $scope.records = result;
        }, function() { alert("Error loading Employee data.")});
*/
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

    $scope.gotoFirst = function() {
        if ($scope.records.length > 0) {
            $scope.record = $scope.records[0];
        }
    };

    $scope.gotoPrevious = function() {
        if ($scope.records.length > 0) {
            var index = $scope.records.indexOf($scope.record);
            if (index > 0) {
                $scope.record = $scope.records[index - 1];
            }
        }
    };

    $scope.gotoNext = function() {
        if ($scope.records.length > 0) {
            var index = $scope.records.indexOf($scope.record);
            if (index < ($scope.records.length - 1)) {
                $scope.record = $scope.records[index + 1];
            }
        }
    };


    $scope.gotoLast = function() {
        if ($scope.records.length > 0) {
            $scope.record = $scope.records[$scope.records.length - 1];
        }
    };
    $scope.add = function() {
        var newrecord = {};
        newrecord.id = $scope.determineNextId();

        $scope.records.push(newrecord);
    };

    $scope.delete = function() {
        var rows = $scope.records.length;
        if (rows > 0) {
            $scope.records.splice(rows - 1, 1);
        }
    };

    $scope.print = function() {

    };

    $scope.save = function() {
        EmployeeRepository.saveAll($scope.records);
        dialog.close();
    };

    $scope.cancel = function () {
        dialog.close();
    };
};