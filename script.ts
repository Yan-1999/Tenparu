enum Stage { Backlog, Todo, InProgress, Verify, Done }

const STROAGE_KEY = 'tenparu';

var task_template = <HTMLTemplateElement>document.getElementById('task-template');
var task_list = <HTMLDivElement>document.getElementById('task-list');

class Task {
    name: string;
    due: Date;
    priority: string;
    description: string;
    stage: Stage;

    constructor(name?: string,
        due?: Date,
        priority?: string,
        description?: string,
        stage?: Stage) {
        this.name = name;
        this.due = due;
        this.priority = priority;
        this.description = description;
        this.stage = stage;
    }

    render_div(div: HTMLDivElement) {
        div.getElementsByClassName(
            'task-item-name')[0].textContent = this.name;
        div.getElementsByClassName(
            'task-item-due')[0].textContent = this.due.toISOString();
        div.getElementsByClassName(
            'task-item-priority')[0].textContent = this.priority;
        div.getElementsByClassName(
            'task-item-description')[0].textContent = this.description;
    }

    new_div() {
        let node = task_template.content.querySelector<HTMLDivElement>('.task');
        this.render_div(node);
        return document.importNode(node, true);
    }
}

function addTask(ev: Event) {
    let form: HTMLFormElement = <HTMLFormElement>ev.target;
    let data = new FormData(form);
    let tasks: Task[] = JSON.parse(window.localStorage.getItem(STROAGE_KEY));
    if (tasks === null) {
        tasks = [];
    }
    let name = data.get('task-name').toString();
    for (const task of tasks) {
        if (task.name === name) {
            alert("Task with the name already exits!")
            return false;
        }
    }
    let new_task = new Task(
        name,
        new Date([
            data.get('due-date').toString(),
            data.get('due-time').toString(),
        ].join(' ')),
        data.get('priority').toString(),
        data.get('description').toString(),
        Stage.Todo
    );
    tasks.push(new_task);
    window.localStorage.setItem(STROAGE_KEY, JSON.stringify(tasks));
    let div = new_task.new_div();
    task_list.appendChild(div);
    return false;
}

function loadTask() {
    let tasks = JSON.parse(window.localStorage.getItem(STROAGE_KEY));
    let div: HTMLDivElement = null;
    for (const task of tasks) {
        task.due = new Date(task.due);
        div = Object.assign(new Task(), task).new_div();
        task_list.appendChild(div);
    }
}

/*main*/
document.getElementById('new-task').onsubmit = addTask;
loadTask();
