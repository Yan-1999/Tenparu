var Stage;
(function (Stage) {
    Stage[Stage["Backlog"] = 0] = "Backlog";
    Stage[Stage["Todo"] = 1] = "Todo";
    Stage[Stage["InProgress"] = 2] = "InProgress";
    Stage[Stage["Verify"] = 3] = "Verify";
    Stage[Stage["Done"] = 4] = "Done";
})(Stage || (Stage = {}));
var STROAGE_KEY = 'tenparu';
var task_template = document.getElementById('task-template');
var task_list = document.getElementById('task-list');
var Task = /** @class */ (function () {
    function Task(name, due, priority, description, stage) {
        this.name = name;
        this.due = due;
        this.priority = priority;
        this.description = description;
        this.stage = stage;
    }
    Task.prototype.render_div = function (div) {
        div.getElementsByClassName('task-item-name')[0].textContent = this.name;
        div.getElementsByClassName('task-item-due')[0].textContent = this.due.toISOString();
        div.getElementsByClassName('task-item-priority')[0].textContent = this.priority;
        div.getElementsByClassName('task-item-description')[0].textContent = this.description;
    };
    Task.prototype.new_div = function () {
        var node = task_template.content.querySelector('.task');
        this.render_div(node);
        return document.importNode(node, true);
    };
    return Task;
}());
function addTask(ev) {
    var form = ev.target;
    var data = new FormData(form);
    var tasks = JSON.parse(window.localStorage.getItem(STROAGE_KEY));
    if (tasks === null) {
        tasks = [];
    }
    var name = data.get('task-name').toString();
    for (var _i = 0, tasks_1 = tasks; _i < tasks_1.length; _i++) {
        var task = tasks_1[_i];
        if (task.name === name) {
            alert("Task with the name already exits!");
            return false;
        }
    }
    var new_task = new Task(name, new Date(data.get('due').toString()), data.get('priority').toString(), data.get('description').toString(), Stage.Todo);
    tasks.push(new_task);
    window.localStorage.setItem(STROAGE_KEY, JSON.stringify(tasks));
    var div = new_task.new_div();
    task_list.appendChild(div);
    return false;
}
/*main*/
document.getElementById('new-task').onsubmit = addTask;
