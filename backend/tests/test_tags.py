# tests/test_tags.py
import pytest
from app.models.tags import Tag
from app.crud import tags as tags_crud
from app.schemas.tags import CreateTag, TagUpdate

class TestTags:

    def test_create_tag_success(self, db_session, test_moderator):
        tag_data = CreateTag(
            tag_name="Классика",
            description="Классическая литература"
        )
        
        tag = tags_crud.create_tag(
            db_session, 
            tag_data, 
            user_id=test_moderator.id
        )
        
        assert tag.id is not None
        assert tag.tag_name == "Классика"
        assert tag.description == "Классическая литература"


    def test_get_all_tags(self, db_session, test_moderator):
        tags_crud.create_tag(db_session, CreateTag(tag_name="Тег1", description="Описание1"), 
                            user_id=test_moderator.id)
        tags_crud.create_tag(db_session, CreateTag(tag_name="Тег2", description="Описание2"), 
                            user_id=test_moderator.id)
        
        tags = tags_crud.get_all_tags(db_session)
        
        assert len(tags) >= 2

    def test_update_tag(self, db_session, test_moderator):
        tag = tags_crud.create_tag(db_session, CreateTag(tag_name="Старое", description="Старое описание"),
                                  user_id=test_moderator.id)
        
        try:
            updated = tags_crud.update_tag(db_session, tag.id, tag_name="Новое")
        except TypeError:
            updated = tags_crud.update_tag(db_session, tag.id, TagUpdate(tag_name="Новое"))
        
        assert updated.tag_name == "Новое"

    def test_update_tag_description(self, db_session, test_moderator):
        tag = tags_crud.create_tag(db_session, CreateTag(tag_name="Тег", description="Старое описание"),
                                  user_id=test_moderator.id)
        
        try:
            updated = tags_crud.update_tag(db_session, tag.id, description="Новое описание")
        except TypeError:
            updated = tags_crud.update_tag(db_session, tag.id, TagUpdate(description="Новое описание"))
        
        assert updated.tag_name == "Тег"
        assert updated.description == "Новое описание"

    def test_delete_tag(self, db_session, test_moderator):
        tag = tags_crud.create_tag(db_session, CreateTag(tag_name="На удаление", description="Будет удален"),
                                  user_id=test_moderator.id)
        
        try:
            result = tags_crud.delete_tag(db_session, tag.id, user_id=test_moderator.id)
        except TypeError:
            result = tags_crud.delete_tag(db_session, tag.id)
        
        assert result is True
        assert db_session.query(Tag).filter(Tag.id == tag.id).first() is None