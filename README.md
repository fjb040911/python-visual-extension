# Python-Visual
A VSCode Extension that can visually execute Python scripts and render results in rich ways.
The print(str) can be rendered as logs, tables, charts, and albums
![all](https://github.com/fjb040911/python-visual-extension/assets/8717555/7fce4708-012d-403b-b9f9-d1c811d6519c)
## How to use
### Create Solution
![create](https://github.com/fjb040911/python-visual-extension/assets/8717555/7580fbc4-67d1-4b9e-aa5d-874baed36d34)
In the solution editor, you can configure interactive forms and bind Python to be called
### Configure interactive Forms and Script Worker
![formAndWorker](https://github.com/fjb040911/python-visual-extension/assets/8717555/d838aa61-369b-446e-b961-9d383eb775f2)

## Rich Output
### Python receiving parameters and basic log output
![log-print](https://github.com/fjb040911/python-visual-extension/assets/8717555/7e4b560a-ba44-4495-b82e-62c6ee38750b)
All outputs are generated through the **print()** method

### Long execution waiting for completion
![wait](https://github.com/fjb040911/python-visual-extension/assets/8717555/25b79910-fba0-43b0-9870-25e39698ea16)

### Output Table
![tabeOut](https://github.com/fjb040911/python-visual-extension/assets/8717555/d1f7d546-a415-4746-9814-333e2d082fe9)
```python
import json

table = {
  'renderType': 'table',
  'columns': [
  {
    'title': 'Name',
    'dataIndex': 'name',
  },
  {
    'title': 'Age',
    'dataIndex': 'age',
  },
  {
    'title': 'Favorite',
    'dataIndex': 'favorite',
  },
],
 'data': [
  {
    'name': 'name1',
    'age': 18,
    'favorite':  'favorite',
  },
  {
    'name': 'name2',
    'age': 20,
    'favorite': 'favorite',
  }
]
}

print(json.dumps(table))
```
### Output Local Album
![photo](https://github.com/fjb040911/python-visual-extension/assets/8717555/523e50dc-5b14-4358-8246-da574f773469)
```python
import json

photo1 = {
 'renderType': 'imgs',
 'title': 'My Photos',
 'path': '/Users/fangjianbing/work/yix/val2017',
 # 'col': 4,
 # 'pageSize': 24
}

print(json.dumps(photo1))
```
### Output Chart
Can output [eChart](https://echarts.apache.org/examples/en/index.html) charts
![charts](https://github.com/fjb040911/python-visual-extension/assets/8717555/4f8eba52-bdbc-4924-aa36-2f2b8de96463)
```python
import json

chart = {
    'renderType': 'chart',
    'options': {
        'title': {
            'text': 'Chart2'
        },
        'xAxis': {
            'type': 'category',
            'data': ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
        },
        'yAxis': {
            'type': 'value'
        },
        'series': [
            {
            'data': [120, 200, 150, 80, 70, 110, 130],
            'type': 'bar'
            }
        ]
    }
}
print(json.dumps(chart))
```
Please refer to the [eChart document](https://echarts.apache.org/examples/en/index.html) for the values of **options**
