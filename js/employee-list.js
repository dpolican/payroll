/**
 * Created with JetBrains WebStorm.
 * User: ewkoenw
 * Date: 9/4/13
 * Time: 8:50 PM
 * To change this template use File | Settings | File Templates.
 */

function EmployeeListController($scope, EmployeeRepository) {
    $scope.employees;
    $scope.employee;

    $scope.loadEmployeeList = function() {
        EmployeeRepository.getAll()
            .then(function(result){
                result.sort(function(a, b) {
                    return (a.lastName < b.lastName) ? -1 : ((a.lastName > b.lastName) ? 1 : (a.firstName < b.firstName) ? -1 : 1);
                });
                $scope.employees = result;
                if ($scope.employees.length > 0) { $scope.employee = $scope.employees[0]; }
                if(!$scope.$$phase) { $scope.$apply(); }
            }, function() { alert("Error loading Employee list.")});
    };

    $scope.loadEmployeeList();
}
