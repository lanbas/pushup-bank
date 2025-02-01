# pushup-bank
beefy boy bank branch

### Contributing 
Initial development has been developed and tested on Ubuntu 22.04 and Python 3.10.12

#### Setup Environment

```
git clone git@github.com:lanbas/pushup-bank.git
cd pushup-bank
```

#### Setup virtual environment
```
python3 -m venv env
source env/bin/activate
```


#### Install dependencies via ```pip```
```
(env) python3 -m pip install -r requirements.txt
```

### Test Installation
Once the dependencies have been installed, the follow command should run the server: 
```
(env) fastapi dev server.py
```

The server will be accessible on http://localhost:8000/home.

### Accessing from a mobile device
Run the server under production settings: 
```
(env) fastapi run server.py
```

The server will be accessible from another device on http://<host computer's IP>:8000/home