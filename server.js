const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt-nodejs');
const knex = require('knex');

const db = knex({
  client: 'pg',
  connection: {
    host : '127.0.0.1',
    user : 'postgres',
    password : '',
    database : 'post-it'
  }
});

const app = express();
app.use(express.json())
app.use(cors())

// =======================================
// Endpoints //
// =======================================


//Getting user's data

app.get('/get-user-info/:email',(req, res) => {
	const { email } = req.params;

	db('*')
	.from('users')
	.where({email})
		.then(data => res.json(data[0]))
		.catch(err => res.status(400).json('user not found'))
})

// =======================================


//Getting all posts

app.get('/get-all-posts',(req, res) => {
	db('*')
	.from('posts')
		.then(data => {
			res.json(data)
		})
		.catch(err => res.status(400).json('something went wrong response?'))
})

// =======================================

app.get('/get-user-posts/:email',(req, res) => {
	const { email } = req.params;

	db('*')
	.from('posts')
	.where({email})
		.then(data => {
			res.json(data)
		})
		.catch(err => res.status(400).json('something went wrong response?'))
})

// =======================================

// Sign in to app

app.post('/login', (req, res) => {
	const { email, password } = req.body;

	if(!email || !password) {
		console.log('should actually throw error')

		//error something went wrong return modal popper
	}


	db.select('*')
	.from('login')
	.where({email: email}/*NOTICE - to change*/)
		.then(data => {

			const isValid = bcrypt.compareSync(password, data[0].hash)

			if(isValid) {
				db.select('*')
				.from('users')
				.where({email: emailForNow}/*NOTICE - to change*/)
					.then(user => {
						res.json(user[0])
					})
					.catch(/* error user not found */ )
			}
		})
		.catch(/* error is in credentials */ )
})

// =======================================

//Register to app

app.post('/register', (req, res) => {
	const { email, password, name } = req.body;

	if(!email || !name || !password) {
		return res.status(400).json(/*ERROR*/)
	}

	const hash = bcrypt.hashSync(password);

	db.transaction(trx => {
		trx
		.insert({
			email,
			hash
		})
		.into('login')
		.then(() => {
			return trx('users')
			.returning('*')
			.insert({
				email: email.toLowerCase(),
				name,
				joined: new Date().toString().substring(0, 10)
			})
				.then(user => {
					res.json(user[0])
				})
		})
		.then(trx.commit)
		.catch(trx.rollback)
	})
	.catch(/*ERROR*/)

})

// =======================================

// Add a new post

app.post('/add-post', (req, res) => {
	const { email, name, content } = req.body;

	db.transaction(trx => {
		trx.insert({
			email,
			content,
			name,
			created: new Date().toString().substring(0, 10)
		})
		.into('posts')
		.returning('id')
			.then(id => {
				return trx
				.select('posts')
				.from('users')
				.where({email: email})
					.then(oldPostsArray => {
						const newPostsArray = [...oldPostsArray[0].posts, id[0]]
						return trx('users')
						.where({email: email})
						.update({posts: newPostsArray})
						.returning('*')
							.then(/*NEED TO DECIDE WHAT TO SEND BACK)*/ console.log('add post - return?'))

					})
					.then(trx.commit)
					.catch(trx.rollback)
			})
	})

})

// =======================================

//Delete a post

app.delete('/delete-post/:id', (req, res) => {
	const { id } = req.params;

	//finding and removing the post from 'posts' by id
	db.transaction(trx => {
		trx('posts')
		.where({id})
		.del()
		.returning('email')
			.then(userEmail => {
				//returning the post's email and finding the user by email
				return trx.select('posts')
				.from('users')
				.where({email: userEmail[0]})
					.then( oldPostsArray => {
						console.log(oldPostsArray[0].posts)
						newPostsArray = oldPostsArray[0].posts.filter(postId => postId !== id);
						// removing post from user's posts array
						return trx('users')
						.where({email: userEmail[0]})
						.update({ posts: newPostsArray})
							.then(result => console.log(/*need to decide*/'delete post responsd with success?' ))
					})
					.then(trx.commit)
					.catch(trx.rollback)

			})	
	})
})


// =======================================


// 'sign-in' - done
// 'register' - done
// 'get-all-posts'
// 'get-user-posts'
// 'get-user-data' - done
// 'add-post' - done
// 'delete-post' - done
// 'add-like'
// 'remove-like'

//

// =======================================
// =======================================


app.listen(3001, () => {
	console.log('app is running on port 3001');
})